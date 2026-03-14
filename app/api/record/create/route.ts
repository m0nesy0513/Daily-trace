import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { user_id, content, entry_summary, daily_summary } = body;

    if (!content || !entry_summary || !daily_summary) {
      return Response.json(
        { error: "缺少必要字段" },
        { status: 400 }
      );
    }

    const now = new Date();
    const day = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0]; // HH:MM:SS

    const { data, error } = await supabase
      .from("records")
      .insert([
        {
          user_id,
          day,
          time,
          content,
          entry_summary,
          daily_summary,
        },
      ])
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data });
  } catch (error) {
    return Response.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}