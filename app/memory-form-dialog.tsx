// memory-form-dialog.tsx

"use client";
import { ReactNode, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Image from "next/image";

import { uploadImage, getPublicUrl } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MapPinIcon, CalendarIcon, ImageIcon, SaveIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Memory {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "image";
  location?: string;
  image?: string;
}

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  date: z.date(),
  location: z.string().optional(),
});

interface MemoryFormDialogProps {
  trigger: ReactNode;
}

export default function MemoryFormDialog({ trigger }: MemoryFormDialogProps) {
  const [open, setOpen] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      location: "",
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let uploadedImageUrl: string | undefined;

    if (selectedFile) {
      try {
        const path = await uploadImage(selectedFile, "memories");
        uploadedImageUrl = getPublicUrl("memories", path);
      } catch (err) {
        console.error("Error uploading file:", err);
      }
    }

    const newMemory: Memory = {
      id: uuidv4(),
      date: format(values.date, "yyyy-MM-dd"),
      title: values.title,
      description: values.description,
      type: "image",
      location: values.location || undefined,
      image: uploadedImageUrl,
    };

    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMemory),
      });
      if (!res.ok) throw new Error("Failed to create memory");
      await res.json();
    } catch (err) {
      console.error("Error:", err);
    }

    setOpen(false);
    form.reset();
    setSelectedFile(null);
    setPreviewUrl("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-black border-zinc-900 text-zinc-400 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Memory</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Memory title"
                      {...field}
                      className="bg-black border border-zinc-800 text-zinc-400 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your memory..."
                      {...field}
                      className="bg-black border border-zinc-800 text-zinc-400 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-zinc-400">Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal bg-black border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 focus:outline-none",
                            !field.value && "text-zinc-400"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-black border border-zinc-800" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="rounded-md" />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <Input
                        placeholder="Where was this?"
                        {...field}
                        className="pl-10 bg-black border border-zinc-800 text-zinc-400 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div {...getRootProps()} className="border-2 border-dashed border-zinc-600 p-4 text-center cursor-pointer mt-4 text-zinc-300 hover:bg-zinc-900 transition-colors">
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-white">Drop the image here...</p>
              ) : (
                <p className="flex flex-col items-center">
                  <ImageIcon className="h-5 w-5 mb-1" />
                  Drag & drop an image, or click to select
                </p>
              )}
            </div>

            {previewUrl && (
              <div className="mt-2 mx-auto relative aspect-square w-48 h-48">
                <Image src={previewUrl} alt="Selected preview" fill sizes="192px" className="object-cover rounded-md border border-zinc-700" />
              </div>
            )}

            <Button type="submit" className="w-full mt-6 hover:bg-zinc-900 hover:text-white border border-zinc-800 bg-black text-zinc-400 transition-all">
              <SaveIcon className="mr-2 h-4 w-4" />
              Save Memory
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
