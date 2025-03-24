import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json(); // parse the incoming body
    const { date, title, description, location } = body;

    // Make sure your table columns match these fields
    const { data, error } = await supabase
      .from("memories")
      .insert([{ date, title, description, location }])
      .select("*")
      .single();

    if (error) {
      // This is likely where your 400 is coming from
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ memory: data }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/memories:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
