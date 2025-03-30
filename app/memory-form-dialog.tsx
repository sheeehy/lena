"use client";

import type React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { uploadImage, getPublicUrl } from "@/lib/supabase";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpToLine, PlusIcon, ChevronRight, AlertCircle, Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const THEME = {
  bgPrimary: "bg-zinc-950",
  bgSecondary: "bg-zinc-950",
  bgInput: "bg-zinc-900",
  bgActive: "bg-zinc-900",
  bgHover: "bg-zinc-800",
  textPrimary: "text-white",
  textSecondary: "text-zinc-500",
  textMuted: "text-zinc-500",
  errorBg: "bg-red-600/40",
  errorText: "text-red-500/90",
  successBg: "bg-green-900/50",
  successText: "text-green-100",
  radiusDialog: "rounded-2xl",
  radiusButton: "rounded-xl",
  radiusInput: "rounded-xl",
  radiusTabs: "rounded-xl",
  radiusNotification: "rounded-xl",
};

const globalStyles = `
  * {
    outline: none !important;
  }

  input:focus, textarea:focus, button:focus, [tabindex]:focus {
    outline: none !important;
    box-shadow: none !important;
    ring: 0 !important;
    ring-offset: 0 !important;
  }
`;

export interface Memory {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "image";
  location?: string;
  image?: string;
}

const dateStringSchema = z.string().refine((value) => {
  if (!/^\d{2}\s\d{2}\s\d{4}$/.test(value)) return false;
  const dateParts = value.split(" ");
  const day = Number.parseInt(dateParts[0], 10);
  const month = Number.parseInt(dateParts[1], 10) - 1;
  const year = Number.parseInt(dateParts[2], 10);
  const date = new Date(year, month, day);
  return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
}, {});

const formSchema = z.object({
  title: z.string().nonempty(),
  description: z.string().nonempty(),
  date: dateStringSchema,
  location: z.string().optional(),
});

type Step = "date" | "title" | "description" | "location" | "image";
const STEPS: Step[] = ["date", "title", "description", "location", "image"];

const STEP_HEIGHTS: Record<Step, number> = {
  date: 150,
  title: 120,
  description: 220,
  location: 120,
  image: 390,
};

const NAV_HEIGHT = 56;
const FOOTER_HEIGHT = 73;
const DIALOG_TOP_POSITION = "20vh";

function getTotalHeight(step: Step): number {
  return NAV_HEIGHT + STEP_HEIGHTS[step] + FOOTER_HEIGHT;
}

const containerInitial = {
  scale: 0,
  opacity: 0,
  height: getTotalHeight("date"),
};

const containerVisible = (step: Step, errors: Record<Step, boolean>) => ({
  scale: 1,
  opacity: 1,
  height: getTotalHeight(step),
  transition: {
    type: "spring",
    damping: 22,
    stiffness: 380,
    mass: 0.45,
  },
});

const containerExit = {
  scale: 0,
  opacity: 0,
  transition: { duration: 0.2 },
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 500 },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { ease: "easeOut", duration: 0.2 } },
  exit: { opacity: 0, transition: { ease: "easeIn", duration: 0.1 } },
};

type NotificationType = "success" | "error" | null;

interface Notification {
  type: NotificationType;
  message: string;
}

export default function MemoryFormDialog({ trigger }: { trigger: React.ReactNode }) {
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = globalStyles;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("date");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: format(new Date(), "dd MM yyyy"),
      location: "",
    },
    // Keep mode/reValidate onChange for other fields,
    // but we'll manually control date's error so it doesn't show while typing
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const { control, trigger: triggerValidation, handleSubmit, formState, setValue, reset } = form;
  const { errors } = formState;

  const stepErrors = {
    date: !!errors.date,
    title: !!errors.title,
    description: !!errors.description,
    location: !!errors.location,
    image: false,
  };

  // Focus correct field on step change
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      switch (currentStep) {
        case "date":
          dateInputRef.current?.focus();
          break;
        case "title":
          titleInputRef.current?.focus();
          break;
        case "description":
          descriptionInputRef.current?.focus();
          break;
        case "location":
          locationInputRef.current?.focus();
          break;
      }
    }, 300);
    return () => clearTimeout(focusTimer);
  }, [currentStep]);

  // We set the date field without validation on each keystroke,
  // then trigger date validation only on blur or "Next" click
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);

    if (value.length > 4) {
      value = `${value.slice(0, 2)} ${value.slice(2, 4)} ${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)} ${value.slice(2)}`;
    }
    // do NOT validate on every keystroke
    setValue("date", value, { shouldValidate: false });
  };

  const handleDateBlur = async () => {
    // On blur, we validate the date
    await triggerValidation("date");
  };

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({ type, message });
    if (type === "success") {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  const handleResetImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedFile(null);
    setPreviewUrl("");
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let uploadedImageUrl: string | undefined;
    try {
      const dateParts = values.date.split(" ");
      const day = Number.parseInt(dateParts[0], 10);
      const month = Number.parseInt(dateParts[1], 10) - 1;
      const year = Number.parseInt(dateParts[2], 10);
      const dateObj = new Date(year, month, day);

      if (selectedFile) {
        if (!previewUrl.startsWith("https://")) {
          try {
            setIsUploading(true);
            const path = await uploadImage(selectedFile, "memories");
            uploadedImageUrl = getPublicUrl("memories", path);
            setIsUploading(false);
          } catch (err) {
            setIsUploading(false);
            showNotification("error", "We couldn't upload your image. Please try again.");
            return;
          }
        } else {
          uploadedImageUrl = previewUrl;
        }
      }

      const newMemory: Memory = {
        id: uuidv4(),
        date: format(dateObj, "yyyy-MM-dd"),
        title: values.title,
        description: values.description,
        type: "image",
        location: values.location || undefined,
        image: uploadedImageUrl,
      };

      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMemory),
      });

      if (!res.ok) throw new Error("Failed to create memory");
      await res.json();

      showNotification("success", "Your memory has been saved successfully.");
      setTimeout(() => {
        setOpen(false);
        reset();
        setSelectedFile(null);
        setPreviewUrl("");
        setCurrentStep("date");
        setNotification(null);
      }, 1500);
    } catch (err) {
      showNotification("error", "We couldn't save your memory. Please try again.");
      console.error("Error creating memory:", err);
    }
  }

  const isLastStep = currentStep === STEPS[STEPS.length - 1];

  // Step nav
  const handleNext = async () => {
    if (currentStep === "image") {
      handleSubmit(onSubmit)();
      return;
    }
    // If we're on date step, let's ensure it gets validated
    // because we suppressed validation on each keystroke
    if (currentStep === "date") {
      const valid = await triggerValidation("date");
      if (!valid) return;
    } else {
      const valid = await triggerValidation(currentStep as any);
      if (!valid) return;
    }
    const idx = STEPS.indexOf(currentStep);
    setCurrentStep(STEPS[idx + 1]);
  };

  const handleClose = () => setOpen(false);

  function renderStepContent() {
    switch (currentStep) {
      case "date":
        return (
          <FormField
            control={control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="space-y-4">
                    <p className={`${THEME.textSecondary} text-sm`}>When did this happen?</p>
                    <Input
                      placeholder="DD MM YYYY"
                      {...field}
                      ref={dateInputRef}
                      onChange={handleDateChange}
                      onBlur={handleDateBlur} // validate on blur
                      className={`${THEME.bgInput} ${THEME.textPrimary} placeholder:${THEME.textMuted} focus:outline-none border-0 ${THEME.radiusInput} text-sm py-6 w-full focus:ring-0 focus:ring-offset-0`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && field.value.length === 10) {
                          e.preventDefault();
                          handleNext();
                        }
                      }}
                    />
                    <p className={`${THEME.textSecondary} text-sm`}>
                      Not sure?
                      <span className="text-zinc-300 ml-[0.1rem] cursor-pointer hover:text-white transition ease-in-out"> date range</span>
                    </p>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        );
      case "title":
        return (
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="space-y-4">
                    <p className={THEME.textSecondary + " text-sm"}>Give your memory a title</p>
                    <Input
                      placeholder="Memory title"
                      {...field}
                      ref={titleInputRef}
                      className={`${THEME.bgInput} ${THEME.textPrimary} placeholder:${THEME.textMuted} focus:outline-none border-0 ${THEME.radiusInput} text-sm py-6 w-full focus:ring-0 focus:ring-offset-0`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && field.value.trim()) {
                          e.preventDefault();
                          handleNext();
                        }
                      }}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        );
      case "description":
        return (
          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="space-y-4">
                    <p className={THEME.textSecondary + " text-sm"}>Give your memory a description</p>
                    <Textarea
                      wrap="soft"
                      placeholder="Describe your memory..."
                      {...field}
                      ref={descriptionInputRef}
                      className={`${THEME.bgInput} ${THEME.textPrimary} placeholder:${THEME.textMuted} focus:outline-none border-0 ${THEME.radiusInput} min-h-[150px] text-sm w-full focus:ring-0 focus:ring-offset-0 resize-none whitespace-pre-wrap`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey && field.value.trim()) {
                          e.preventDefault();
                          handleNext();
                        }
                      }}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        );
      case "location":
        return (
          <FormField
            control={control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="space-y-4">
                    <p className={THEME.textSecondary + " text-sm"}>Where did this memory take place?</p>
                    <div className="relative">
                      <Input
                        placeholder="Where was this?"
                        {...field}
                        ref={locationInputRef}
                        className={`${THEME.bgInput} ${THEME.textPrimary} placeholder:${THEME.textMuted} focus:outline-none border-0 ${THEME.radiusInput} text-sm py-6 w-full focus:ring-0 focus:ring-offset-0`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                      />
                    </div>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        );
      case "image":
        return (
          <div className="space-y-4">
            <p className={`${THEME.textSecondary} text-sm flex items-center mb-6 justify-center`}>Add an image to your memory</p>
            <AnimatePresence mode="wait">
              {!selectedFile ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  {...(getRootProps() as any)}
                  className={`aspect-square w-full max-w-[300px] mx-auto ${THEME.bgInput} ${THEME.radiusInput} overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out outline outline-dotted outline-4 outline-offset-2 outline-zinc-900 hover:scale-110`}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className={`aspect-square w-full max-w-[300px] mx-auto ${THEME.bgInput} ${THEME.radiusInput} overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out `}
                    >
                      <p className={THEME.textPrimary}>Drop to upload</p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      <div className={`rounded-full p-3 mb-3`}>
                        <ArrowUpToLine className={`h-6 w-6 ${THEME.textSecondary}`} />
                      </div>
                      <p className={`text-sm ${THEME.textSecondary}`}>Upload Image</p>
                      <p className={`text-xs ${THEME.textMuted} mt-1`}>or drag and drop</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative aspect-square w-full max-w-[300px] mx-auto rounded-md overflow-hidden group"
                >
                  <Image src={previewUrl || "/placeholder.svg"} alt="Selected preview" fill sizes="300px" className="object-cover" />
                  <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetImage}
                      className="bg-black/50 border-zinc-600 hover:bg-zinc-800 text-white cursor-pointer focus:ring-0 focus:ring-offset-0"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Change
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-pointer"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={handleClose}
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center" style={{ paddingTop: DIALOG_TOP_POSITION }}>
              <motion.div
                initial={containerInitial}
                animate={containerVisible(currentStep, stepErrors)}
                exit={containerExit}
                style={{ transformOrigin: "top center" }}
                className={`${THEME.bgPrimary} ${THEME.radiusDialog} shadow-xl overflow-hidden w-[550px] max-w-[90vw]`}
                onClick={(e) => e.stopPropagation()}
              >
                <Form {...form}>
                  <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col w-full h-full">
                    {/* Nav */}
                    <div className={`w-full flex items-center px-1 ${THEME.bgSecondary}`} style={{ height: NAV_HEIGHT }}>
                      <div className="flex-1 flex relative">
                        {STEPS.map((step) => (
                          <motion.button
                            key={step}
                            type="button"
                            onClick={() => setCurrentStep(step)}
                            className={cn(
                              `w-1/5 flex items-center justify-center text-xs font-medium relative py-4 px-4 cursor-pointer focus:outline-none rounded-xl transition-colors duration-300`,
                              currentStep === step ? THEME.textPrimary : stepErrors[step] ? THEME.errorText : THEME.textMuted,
                              currentStep !== step && "hover:text-white"
                            )}
                            whileTap={{ scale: 0.95 }}
                            animate={
                              stepErrors[step] && step !== currentStep
                                ? {
                                    color: [THEME.textMuted, THEME.errorText, THEME.errorText, THEME.textMuted],
                                    transition: {
                                      times: [0, 0.2, 0.8, 1],
                                      duration: 2,
                                      ease: "easeInOut",
                                    },
                                  }
                                : {}
                            }
                          >
                            <span className="relative z-10 pointer-events-none">{step.charAt(0).toUpperCase() + step.slice(1)}</span>
                          </motion.button>
                        ))}
                        {/* Active tab highlight */}
                        <motion.div
                          layoutId="activeTabBackground"
                          className={cn(
                            `absolute h-[calc(100%-8px)] top-1 ${THEME.radiusTabs} transition-colors duration-300`,
                            stepErrors[currentStep] ? THEME.errorBg : THEME.bgActive
                          )}
                          style={{
                            left: `calc(${STEPS.indexOf(currentStep) * 20}% + 4px)`,
                            width: `calc(20% - 8px)`,
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      </div>
                      <motion.button
                        type="button"
                        onClick={handleClose}
                        className={`flex items-center justify-center h-8 w-8 rounded-full ${THEME.textSecondary} hover:${THEME.textPrimary} hover:${THEME.bgActive} transition-colors mr-2 mt-1 focus:outline-none cursor-pointer`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                      </motion.button>
                    </div>

                    {/* Content */}
                    <div className="relative flex-1 overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentStep}
                          variants={contentVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute inset-0 px-6 py-6 overflow-y-auto"
                        >
                          <AnimatePresence>{notification && <NotificationBanner notification={notification} setNotification={setNotification} />}</AnimatePresence>
                          {renderStepContent()}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className={`w-full flex items-center justify-center p-4 ${THEME.bgSecondary}`} style={{ height: FOOTER_HEIGHT }}>
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={isUploading}
                        className={` bg-white cursor-pointer text-black transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.320,1.275)] ${THEME.radiusButton} flex items-center justify-center focus:ring-0 focus:ring-offset-0 hover:scale-[1.02]`}
                      >
                        {isLastStep ? (
                          <div className="flex items-center">
                            <span>Add Memory</span>
                            <PlusIcon className="ml-2 h-4 w-4 translate-y-[0.5px]" />
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span>Continue</span>
                            <ChevronRight className="ml-2 h-4 w-4 translate-y-[0.5px]" />
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

interface NotificationBannerProps {
  notification: Notification | null;
  setNotification: React.Dispatch<React.SetStateAction<Notification | null>>;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ notification, setNotification }) => {
  if (!notification) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        `px-4 py-3 mb-4 ${THEME.radiusNotification} flex items-center justify-between transition-colors`,
        notification.type === "success" ? `${THEME.successBg} ${THEME.successText}` : `${THEME.errorBg} ${THEME.errorText}`
      )}
    >
      <div className="flex items-center gap-2">
        {notification.type === "success" ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
        <span className="ml-2">{notification.message}</span>
      </div>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full focus:ring-0 focus:ring-offset-0" onClick={() => setNotification(null)}></Button>
    </motion.div>
  );
};
