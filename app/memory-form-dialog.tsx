"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { supabase, uploadImage, getPublicUrl } from "@/lib/supabase";
// ^ Make sure you have these helpers in your supabase.ts

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, MapPinIcon, PlusIcon, SaveIcon, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Your Memory interface from data.ts, extended with `image?: string;`
export interface Memory {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "image";
  location?: string;
  image?: string; // For the Supabase public URL
}

// Define the Zod schema for your form
const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  date: z.date(),
  location: z.string().optional(),
  // The user won't manually set an image URL; we handle via drag & drop
});

export default function MemoryFormDialog() {
  const [open, setOpen] = useState(false);

  // We'll store the *uploaded* image's public URL in local state
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      location: "",
    },
  });

  // =========== DRAG & DROP LOGIC ===========
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    try {
      // 1) Upload to Supabase Storage
      const path = await uploadImage(file, "memories");
      // 2) Build the public URL
      const publicUrl = getPublicUrl("memories", path);
      console.log("Uploaded file path:", path, "Public URL:", publicUrl);
      setUploadedImageUrl(publicUrl);
    } catch (err) {
      console.error("Error uploading file:", err);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Build the memory object
    const newMemory: Memory = {
      id: uuidv4(),
      date: format(values.date, "yyyy-MM-dd"), // e.g. "2025-03-03"
      title: values.title,
      description: values.description,
      type: "image",
      location: values.location || undefined,
      image: uploadedImageUrl || undefined,
    };

    try {
      // Insert the memory via your /api/memories route
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMemory),
      });
      if (!res.ok) throw new Error("Failed to create memory");
      const data = await res.json();
      console.log("Created memory:", data.memory);
    } catch (err) {
      console.error("Error:", err);
    }

    // Reset form, close dialog
    setOpen(false);
    form.reset();
    setUploadedImageUrl("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="rounded-full shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105">
          <PlusIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white shadow-lg shadow-primary/5 dark">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Memory</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Memory title" {...field} className="bg-zinc-800 border-zinc-700 text-white focus:ring-primary/20 transition-all duration-200" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your memory..."
                      {...field}
                      className="bg-zinc-800 border-zinc-700 text-white focus:ring-primary/20 transition-all duration-200 min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Field */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-foreground">Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 transition-colors duration-200",
                            !field.value && "text-zinc-400"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-zinc-800 border-zinc-700" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="rounded-md border-border" />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Field */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Where was this?" {...field} className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:ring-primary/20 transition-all duration-200" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DRAG & DROP for IMAGE */}
            <div {...getRootProps()} className="border-2 border-dashed border-zinc-600 p-4 text-center cursor-pointer mt-4 text-zinc-300 hover:bg-zinc-800 transition-colors">
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-primary">Drop the image here...</p>
              ) : (
                <p className="flex flex-col items-center">
                  <ImageIcon className="h-5 w-5 mb-1" />
                  Drag & drop an image, or click to select
                </p>
              )}
            </div>
            {/* Show preview of the uploaded image if any */}
            {uploadedImageUrl && (
              <div className="mt-2 text-center">
                <img src={uploadedImageUrl} alt="Uploaded preview" className="inline-block max-h-48 object-cover border border-zinc-700" />
              </div>
            )}

            {/* Save Button */}
            <Button type="submit" className="w-full mt-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <SaveIcon className="mr-2 h-4 w-4" />
              Save Memory
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
