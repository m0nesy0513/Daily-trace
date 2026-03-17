import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const user_id = body.user_id?.trim?.() || body.user_id;
    const day = body.day?.trim?.() || body.day;
    const time = body.time?.trim?.() || body.time;
    const content = body.content?.trim?.() || body.content;
    const entry_summary = body.entry_summary || "";
    const daily_summary = body.daily_summary || "";

    if (!user_id || !day || !time || !content) {
      return Response.json(
        { error: "缺少必要字段" },
        { status: 400 }
      );
    }

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
      return Response.json(
        { error: error.message || "保存失败" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "保存成功",
      record: data?.[0] ?? null,
    });
  } catch {
    return Response.json(
      { error: "服务器出错了" },
      { status: 500 }
    );
  }
}