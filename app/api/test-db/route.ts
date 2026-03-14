import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("users").select("*");

  return Response.json({ data, error });
}