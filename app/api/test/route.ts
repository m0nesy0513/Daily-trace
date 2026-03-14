import { supabase } from "@/lib/supabase";

export async function GET() {

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        username: "testuser",
        tag: "A001",
        full_username: "testuser#A001",
        password_hash: "testhash"
      }
    ])
    .select();

  if (error) {
    return Response.json({ error });
  }

  return Response.json({ data });
}