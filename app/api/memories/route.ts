import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // or however you're connecting

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // destructure the data from body
    const { date, title, description, location } = body;

    console.log("Incoming body:", body); // <-- 1) LOG IT

    // Insert into your DB (Supabase, etc.)
    const { data, error } = await supabase
      .from("memories")
      .insert([{ date, title, description, location }])
      .single();

    if (error) {
      // 400 means "Bad Request" – usually missing/wrong data
      console.error("Supabase insert error:", error); // <-- 2) LOG EXACT ERROR
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ memory: data }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/memories route:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
