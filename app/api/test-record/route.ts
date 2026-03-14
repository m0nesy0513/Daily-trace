import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("records")
    .insert([
      {
        user_id: null,
        day: "2026-03-15",
        time: "12:00",
        content: "这是一条测试记录",
        entry_summary: "这是单条测试总结",
        daily_summary: "这是当日测试总结",
      },
    ])
    .select();

  if (error) {
    return Response.json({ error });
  }

  return Response.json({ data });
}