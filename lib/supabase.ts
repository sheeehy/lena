import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// A helper to upload files to a chosen bucket
export async function uploadImage(file: File, bucket = "memories") {
  // Example path: "images/<unique-file-name>"
  // We can do a random ID or from the file name
  const fileName = `${crypto.randomUUID()}-${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
    upsert: false, // or true if you want to overwrite
  });
  if (error) throw error;

  // data.path is the relative path to the uploaded file
  return data.path; 
}

// A helper to get a public URL
export function getPublicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
