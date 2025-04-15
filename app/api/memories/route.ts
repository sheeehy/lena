import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Fetch all memories from Supabase
    const { data, error } = await supabase.from("memories").select("*").order("date", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Error in GET /api/memories:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const newMemory = await request.json()

    // Extract only the fields that exist in your Supabase table
    // Remove 'type' since it doesn't exist in your schema
    const { date, title, description, location, image, id } = newMemory

    // Insert into supabase with only the fields that exist in your table
    const { data, error } = await supabase
      .from("memories")
      .insert([{ id, date, title, description, location, image }])
      .select("*")
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ memory: data }, { status: 201 })
  } catch (err) {
    console.error("Error in POST /api/memories:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
