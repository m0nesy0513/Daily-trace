import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

function generateTag(length = 4) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body.username?.trim();
    const password = body.password?.trim();

    if (!username || !password) {
      return Response.json(
        { error: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    if (username.includes("#")) {
      return Response.json(
        { error: "用户名里不要包含 # 号" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: "密码至少需要 6 位" },
        { status: 400 }
      );
    }

    let tag = "";
    let fullUsername = "";
    let exists = true;

    while (exists) {
      tag = generateTag();
      fullUsername = `${username}#${tag}`;

      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("full_username", fullUsername)
        .limit(1);

      exists = !!(data && data.length > 0);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username,
          tag,
          full_username: fullUsername,
          password_hash: passwordHash,
        },
      ])
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      message: "注册成功",
      full_username: fullUsername,
      user: data?.[0] ?? null,
    });
  } catch (error) {
    return Response.json(
      { error: "服务器出错了" },
      { status: 500 }
    );
  }
}