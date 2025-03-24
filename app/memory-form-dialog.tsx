//memory-form-dialog.tsx
"use client";

import { useState } from "react";
import { CalendarIcon, MapPinIcon, PlusIcon, SaveIcon } from "lucide-react";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Memory } from "./data";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  date: z.date(),
  location: z.string().optional(),
});

export default function MemoryFormDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      location: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Create a new memory
    const newMemory: Memory = {
      id: uuidv4(),
      date: format(values.date, "yyyy-MM-dd"),
      title: values.title,
      description: values.description,
      type: "image",
      location: values.location || undefined,
    };

    // Here you would typically add this to your data store
    console.log("New memory:", newMemory);

    // Close the dialog and reset the form
    setOpen(false);
    form.reset();
  }

  return (
    <div className="dark">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="cursor-pointer mt-[0.35rem]">
            <PlusIcon className=" h-4 w-4 cursor-pointer hover:opacity-80 transition ease-in-out" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white shadow-lg shadow-primary/5">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Memory</DialogTitle>
            <DialogDescription className="text-muted-foreground">Capture your moment with all the details.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            variant={"outline"}
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
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Location</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Where was this?"
                          {...field}
                          className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:ring-primary/20 transition-all duration-200"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Memory
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
