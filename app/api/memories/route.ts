// app/api/memories/route.ts (example)
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const newMemory = await request.json();
    const { date, title, description, location, image } = newMemory;

    // Insert into supabase (assuming 'image' column exists)
    const { data, error } = await supabase
      .from("memories")
      .insert([{ date, title, description, location, image }])
      .select("*")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ memory: data }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/memories:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
