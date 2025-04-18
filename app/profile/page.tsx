//profile/page.tsx

"use client";

import { useState } from "react";
import { useUser } from "../context/user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, isLoading, updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when editing starts
  const handleEditClick = () => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setBirthDate(new Date(user.birthDate));
    }
    setIsEditing(true);
  };

  // Save profile changes
  const handleSave = async () => {
    if (!user || !birthDate) return;

    setIsSaving(true);
    try {
      await updateUser({
        name,
        email,
        birthDate: format(birthDate, "yyyy-MM-dd"),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-zinc-500 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">User not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <div className="bg-zinc-900 rounded-xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">User Profile</h1>
          {!isEditing ? (
            <Button onClick={handleEditClick}>Edit Profile</Button>
          ) : (
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-zinc-800">
              {user.avatarUrl ? (
                <img src={user.avatarUrl || "/placeholder.svg"} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500">No Image</div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <Label htmlFor="name" className="text-zinc-400">
                Name
              </Label>
              {isEditing ? <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /> : <div className="text-white text-lg mt-1">{user.name}</div>}
            </div>

            <div>
              <Label htmlFor="email" className="text-zinc-400">
                Email
              </Label>
              {isEditing ? (
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
              ) : (
                <div className="text-white text-lg mt-1">{user.email}</div>
              )}
            </div>

            <div>
              <Label htmlFor="birthDate" className="text-zinc-400">
                Birth Date
              </Label>
              {isEditing ? (
                <div className="mt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !birthDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {birthDate ? format(birthDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={birthDate} onSelect={setBirthDate} initialFocus disabled={(date) => date > new Date()} />
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <div className="text-white text-lg mt-1">{format(new Date(user.birthDate), "MMMM d, yyyy")}</div>
              )}
            </div>

            <div>
              <Label className="text-zinc-400">Account Created</Label>
              <div className="text-zinc-500 text-sm mt-1">{format(new Date(user.createdAt), "MMMM d, yyyy")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
