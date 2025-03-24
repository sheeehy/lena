import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // your file from step 3

export async function POST(request: Request) {
  try {
    const { date, title, description, location } = await request.json();

    const { data, error } = await supabase
      .from('memories')
      .insert([{ date, title, description, location }])
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ memory: data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
