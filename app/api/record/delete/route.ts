import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { mode, user_id, record_id, day, days, record_ids } = body;

    if (!user_id) {
      return Response.json(
        { error: "缺少 user_id" },
        { status: 400 }
      );
    }

    if (mode === "single") {
      const { error } = await supabase
        .from("records")
        .delete()
        .eq("id", record_id)
        .eq("user_id", user_id);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ success: true });
    }

    if (mode === "day") {
      const { error } = await supabase
        .from("records")
        .delete()
        .eq("day", day)
        .eq("user_id", user_id);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ success: true });
    }

    if (mode === "days") {
      const { error } = await supabase
        .from("records")
        .delete()
        .in("day", days || [])
        .eq("user_id", user_id);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ success: true });
    }

    if (mode === "records") {
      const { error } = await supabase
        .from("records")
        .delete()
        .in("id", record_ids || [])
        .eq("user_id", user_id);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ success: true });
    }

    return Response.json(
      { error: "无效的删除模式" },
      { status: 400 }
    );
  } catch (error) {
    return Response.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}