"use client";

import type React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { uploadImage, getPublicUrl } from "@/lib/supabase";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpToLine, PlusIcon, ChevronRight, AlertCircle, Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Memory } from "../types/types";
import { useMemories } from "../context/memory-context";
import { useMemoryDialog } from "../context/memory-dialog-provider";

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

// Global style resets
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

// Basic date input validation – ensures format "DD MM YYYY" is valid
const dateStringSchema = z.string().refine(
  (value) => {
    if (!/^\d{2}\s\d{2}\s\d{4}$/.test(value)) return false;
    const dateParts = value.split(" ");
    const day = Number.parseInt(dateParts[0], 10);
    const month = Number.parseInt(dateParts[1], 10) - 1;
    const year = Number.parseInt(dateParts[2], 10);
    const date = new Date(year, month, day);
    // Must be a real date
    return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
  },
  { message: "Please enter a valid date in DD MM YYYY format." }
);

const formSchema = z.object({
  title: z.string().nonempty(),
  description: z.string().nonempty(),
  date: dateStringSchema,
  location: z.string().optional(),
});

// The steps in this wizard
type Step = "date" | "title" | "description" | "location" | "image";
const STEPS: Step[] = ["date", "title", "description", "location", "image"];

// Vertical layout space for each step in the wizard
const STEP_HEIGHTS: Record<Step, number> = {
  date: 150,
  title: 120,
  description: 220,
  location: 120,
  image: 390,
};

const NAV_HEIGHT = 56;
const FOOTER_HEIGHT = 73;

// Container top offset
const DIALOG_TOP_POSITION = "0vh";

// Helper to compute container height based on step
function getTotalHeight(step: Step): number {
  return NAV_HEIGHT + STEP_HEIGHTS[step] + FOOTER_HEIGHT;
}

// Framer Motion: container transition states
const containerInitial = {
  scale: 0,
  opacity: 0,
  height: getTotalHeight("date"),
};

const containerVisible = (step: Step) => ({
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

// Content fade in/out
const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 500 },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

type NotificationType = "success" | "error" | null;
interface Notification {
  type: NotificationType;
  message: string;
}

interface MemoryFormDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function MemoryFormDialog({ trigger, onSuccess }: MemoryFormDialogProps) {
  const { daysData, addMemory } = useMemories();
  const { closeDialog } = useMemoryDialog();

  // Inject global style resets
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = globalStyles;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Local state
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("date");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Refs to focus inputs as we move steps
  const dateInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // React-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: format(new Date(), "dd MM yyyy"),
      location: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const { control, trigger: triggerValidation, handleSubmit, formState, setValue, setError, reset } = form;
  const { errors } = formState;

  // We track if each step has an error
  const stepErrors = {
    date: !!errors.date,
    title: !!errors.title,
    description: !!errors.description,
    location: !!errors.location,
    image: false,
  };

  // Reset the form whenever the dialog is opened
  useEffect(() => {
    if (open) {
      reset();
      setSelectedFile(null);
      setPreviewUrl("");
      setCurrentStep("date");
      setNotification(null);
      setIsUploading(false);
    }
  }, [open, reset]);

  // Focus inputs on step changes
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

  // Restrict date input to "DD MM YYYY"
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);

    if (value.length > 4) {
      value = `${value.slice(0, 2)} ${value.slice(2, 4)} ${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)} ${value.slice(2)}`;
    }
    setValue("date", value, { shouldValidate: false });
  };

  const handleDateBlur = async () => {
    // Validate the date format
    await triggerValidation("date");
  };

  // Show a global banner notification
  const showNotification = (type: NotificationType, message: string) => {
    setNotification({ type, message });
    if (type === "success") {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Drag/drop image
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

  // Reset the image preview
  const handleResetImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedFile(null);
    setPreviewUrl("");
  };

  // Final submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Parse date from the input
      const dateParts = values.date.split(" ");
      const day = Number.parseInt(dateParts[0], 10);
      const month = Number.parseInt(dateParts[1], 10) - 1;
      const year = Number.parseInt(dateParts[2], 10);
      const dateObj = new Date(year, month, day);
      const dateKey = format(dateObj, "yyyy-MM-dd");

      // Attempt image upload if provided
      let uploadedImageUrl: string | undefined = undefined;
      if (selectedFile) {
        if (!previewUrl.startsWith("https://")) {
          setIsUploading(true);
          const path = await uploadImage(selectedFile, "memories");
          uploadedImageUrl = getPublicUrl("memories", path);
          setIsUploading(false);
        } else {
          uploadedImageUrl = previewUrl;
        }
      }

      // Build the memory
      const newMemory: Memory = {
        id: uuidv4(),
        date: dateKey,
        title: values.title,
        description: values.description,
        location: values.location || undefined,
        image: uploadedImageUrl,
      };

      // Add to UI immediately
      addMemory(newMemory);

      // Send to our API
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMemory),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to create memory: ${res.status} ${res.statusText} ${errorData.error || ""}`);
      }

      // Success
      showNotification("success", "Your memory has been saved successfully.");
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else if (closeDialog) {
          closeDialog();
        } else {
          setOpen(false);
        }
      }, 1500);
    } catch (err) {
      showNotification("error", "We couldn't save your memory. Please try again.");
      console.error("Error creating memory:", err);
    }
  }

  // Helper to handle "Continue" or "Add Memory" button
  const isLastStep = currentStep === STEPS[STEPS.length - 1];

  const handleNext = async () => {
    if (currentStep === "image") {
      handleSubmit(onSubmit)();
      return;
    }

    if (currentStep === "date") {
      // Validate date format
      const validFormat = await triggerValidation("date");
      if (!validFormat) return;

      // Then check if that date is at max capacity (8)
      const dateVal = form.getValues("date");
      const [dd, mm, yyyy] = dateVal.split(" ");
      const dateObj = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      const dateKey = format(dateObj, "yyyy-MM-dd");
      const existingDay = daysData.find((d) => d.date === dateKey);

      if (existingDay && existingDay.memories.length >= 8) {
        // Set an error in the "date" form field so we don't proceed
        setError("date", {
          type: "manual",
          message: `This date has the maximum number of memories.`,
        });
        return;
      }
    } else {
      // Validate the step's field
      const validField = await triggerValidation(currentStep as any);
      if (!validField) return;
    }

    // Move to next step
    const idx = STEPS.indexOf(currentStep);
    setCurrentStep(STEPS[idx + 1]);
  };

  // Attempt to jump steps from the top nav
  async function handleStepClick(step: Step) {
    const newIndex = STEPS.indexOf(step);
    const currentIndex = STEPS.indexOf(currentStep);

    // If user tries to move backward, let them
    if (newIndex < currentIndex) {
      setCurrentStep(step);
      return;
    }

    // If user tries to move forward, validate intermediate steps
    if (currentIndex === 0) {
      // We are on the date step
      const validFormat = await triggerValidation("date");
      if (!validFormat) return;

      const dateVal = form.getValues("date");
      const [dd, mm, yyyy] = dateVal.split(" ");
      const dateObj = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      const dateKey = format(dateObj, "yyyy-MM-dd");
      const existingDay = daysData.find((d) => d.date === dateKey);

      if (existingDay && existingDay.memories.length >= 8) {
        setError("date", {
          type: "manual",
          message: `This date has the maximum number of memories.`,
        });
        return;
      }
      if (newIndex === 1) {
        setCurrentStep("title");
        return;
      }
      // Now we handle subsequent steps
      setCurrentStep("title");
      const validTitle = await triggerValidation("title");
      if (!validTitle) return;

      if (newIndex === 2) {
        setCurrentStep("description");
        return;
      }
      setCurrentStep("description");
      const validDesc = await triggerValidation("description");
      if (!validDesc) return;

      if (newIndex === 3) {
        setCurrentStep("location");
        return;
      }
      setCurrentStep("location");
      const validLoc = await triggerValidation("location");
      if (!validLoc) return;

      if (newIndex === 4) {
        setCurrentStep("image");
        return;
      }
    } else if (currentIndex === 1) {
      const validTitle = await triggerValidation("title");
      if (!validTitle) return;

      if (newIndex === 2) {
        setCurrentStep("description");
        return;
      }
      setCurrentStep("description");
      const validDesc = await triggerValidation("description");
      if (!validDesc) return;

      if (newIndex === 3) {
        setCurrentStep("location");
        return;
      }
      setCurrentStep("location");
      const validLoc = await triggerValidation("location");
      if (!validLoc) return;

      if (newIndex === 4) {
        setCurrentStep("image");
        return;
      }
    } else if (currentIndex === 2) {
      const validDesc = await triggerValidation("description");
      if (!validDesc) return;

      if (newIndex === 3) {
        setCurrentStep("location");
        return;
      }
      setCurrentStep("location");
      const validLoc = await triggerValidation("location");
      if (!validLoc) return;

      if (newIndex === 4) {
        setCurrentStep("image");
        return;
      }
    } else if (currentIndex === 3) {
      const validLoc = await triggerValidation("location");
      if (!validLoc) return;

      if (newIndex === 4) {
        setCurrentStep("image");
        return;
      }
    }

    setCurrentStep(step);
  }

  // Closing
  const handleClose = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      setOpen(false);
    }
  };

  // Step content
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
                      onBlur={handleDateBlur}
                      className={`${THEME.bgInput} ${THEME.textPrimary} placeholder:${THEME.textMuted} focus:outline-none border-0 ${THEME.radiusInput} text-sm py-6 w-full`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && field.value.length === 10) {
                          e.preventDefault();
                          handleNext();
                        }
                      }}
                    />

                    <AnimatePresence mode="popLayout">
                      {errors.date && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="text-red-500 text-sm"
                        >
                          {errors.date.message?.toString()}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className={`${THEME.textSecondary} text-sm`}>
                      Not sure?
                      <span className="text-zinc-300 ml-1 cursor-pointer hover:text-white transition ease-in-out">date range</span>
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
                    <p className={`${THEME.textSecondary} text-sm`}>Give your memory a title</p>
                    <Input
                      placeholder="Memory title"
                      {...field}
                      ref={titleInputRef}
                      className={`${THEME.bgInput} ${THEME.textPrimary} placeholder:${THEME.textMuted} focus:outline-none border-0 ${THEME.radiusInput} text-sm py-6 w-full`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && field.value.trim()) {
                          e.preventDefault();
                          handleNext();
                        }
                      }}
                    />
                    <AnimatePresence mode="popLayout">
                      {errors.title && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="text-red-500 text-sm"
                        >
                          {errors.title.message?.toString()}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                    <p className={`${THEME.textSecondary} text-sm`}>Give your memory a description</p>
                    <Textarea
                      wrap="soft"
                      placeholder="Describe your memory..."
                      {...field}
                      ref={descriptionInputRef}
                      className={`${THEME.bgInput} ${THEME.textPrimary} placeholder:${THEME.textMuted} focus:outline-none border-0 ${THEME.radiusInput} min-h-[150px] text-sm w-full resize-none whitespace-pre-wrap`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey && field.value.trim()) {
                          e.preventDefault();
                          handleNext();
                        }
                      }}
                    />
                    <AnimatePresence mode="popLayout">
                      {errors.description && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="text-red-500 text-sm"
                        >
                          {errors.description.message?.toString()}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                    <p className={`${THEME.textSecondary} text-sm`}>Where did this memory take place?</p>
                    <div className="relative">
                      <Input
                        placeholder="Where was this?"
                        {...field}
                        ref={locationInputRef}
                        className={`${THEME.bgInput} ${THEME.textPrimary} placeholder:${THEME.textMuted} focus:outline-none border-0 ${THEME.radiusInput} text-sm py-6 w-full`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                      />
                      <AnimatePresence mode="popLayout">
                        {errors.location && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="text-red-500 text-sm mt-1"
                          >
                            {errors.location.message?.toString()}
                          </motion.div>
                        )}
                      </AnimatePresence>
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
                  className={`aspect-square w-full max-w-[300px] mx-auto ${THEME.bgInput} ${THEME.radiusInput} overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out outline outline-dotted outline-4 outline-offset-2 outline-zinc-900 hover:scale-105`}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className={`aspect-square w-full max-w-[300px] mx-auto ${THEME.bgInput} ${THEME.radiusInput} overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out`}
                    >
                      <p className={THEME.textPrimary}>Drop to upload</p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      <div className="rounded-full p-3 mb-3">
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
                  transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 300,
                  }}
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

  // The full dialog content for the wizard
  const dialogContent = (
    <DialogContent className="p-0 border-0 bg-transparent">
      <motion.div
        initial={containerInitial}
        animate={containerVisible(currentStep)}
        exit={containerExit}
        style={{ transformOrigin: "top center" }}
        className={cn(THEME.bgPrimary, THEME.radiusDialog, "shadow-xl overflow-hidden w-[550px] max-w-[90vw] fixed z-[9999]", "left-1/2 -translate-x-1/2 -top-36")}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle className="sr-only">Memory Form</DialogTitle>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col w-full h-full">
            {/* Step nav bar */}
            <div className={cn("w-full flex items-center px-1", THEME.bgSecondary)} style={{ height: NAV_HEIGHT }}>
              <div className="flex-1 flex relative">
                {STEPS.map((step) => (
                  <motion.button
                    key={step}
                    type="button"
                    onClick={() => handleStepClick(step)}
                    className={cn(
                      "w-1/5 flex items-center justify-center text-xs font-medium relative py-4 px-4 cursor-pointer focus:outline-none rounded-xl transition-colors duration-300",
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

                {/* Underline that indicates which tab is active */}
                <motion.div
                  layoutId="activeTabBackground"
                  className={cn("absolute h-[calc(100%-8px)] top-1", THEME.radiusTabs, stepErrors[currentStep] ? THEME.errorBg : THEME.bgActive)}
                  style={{
                    left: `calc(${STEPS.indexOf(currentStep) * 20}% + 4px)`,
                    width: "calc(20% - 8px)",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              </div>

              {/* Close button */}
              <motion.button
                type="button"
                onClick={handleClose}
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full",
                  THEME.textSecondary,
                  `hover:${THEME.textPrimary} hover:${THEME.bgActive}`,
                  "transition-colors mr-2 mt-1 focus:outline-none cursor-pointer"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </motion.button>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div key={currentStep} variants={contentVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 px-6 py-6 overflow-y-auto">
                  {/* Show any banner notification */}
                  <AnimatePresence>{notification && <NotificationBanner notification={notification} setNotification={setNotification} />}</AnimatePresence>

                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className={cn("w-full flex items-center justify-center py-4 px-6", THEME.bgSecondary)} style={{ height: FOOTER_HEIGHT }}>
              <Button
                type="button"
                onClick={handleNext}
                disabled={isUploading}
                className={cn(
                  "bg-white w-full cursor-pointer text-black transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.320,1.275)]",
                  THEME.radiusButton,
                  "flex items-center justify-center focus:ring-0 focus:ring-offset-0 hover:scale-[1.02]"
                )}
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
    </DialogContent>
  );

  // If a trigger is given, wrap it in a Dialog
  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {dialogContent}
      </Dialog>
    );
  }

  return dialogContent;
}

// Notification banner with a smooth spring in/out
function NotificationBanner({ notification, setNotification }: { notification: Notification | null; setNotification: React.Dispatch<React.SetStateAction<Notification | null>> }) {
  if (!notification) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="notification"
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          `px-4 py-3 mb-4 ${THEME.radiusNotification} flex items-center justify-between transition-colors`,
          notification.type === "success" ? `${THEME.successBg} ${THEME.successText}` : `${THEME.errorBg} ${THEME.errorText}`
        )}
      >
        <div className="flex items-center gap-2">
          {notification.type === "success" ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="ml-2">{notification.message}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full focus:ring-0 focus:ring-offset-0" onClick={() => setNotification(null)} />
      </motion.div>
    </AnimatePresence>
  );
}
