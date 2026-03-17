import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {

  const { username, tag, password } = await req.json();

  if (!username || !tag || !password) {
    return NextResponse.json(
      { error: "缺少参数" },
      { status: 400 }
    );
  }

  const fullUsername = `${username}#${tag}`;

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("full_username", fullUsername)
    .single();

  if (error || !user) {
    return NextResponse.json(
      { error: "用户不存在" },
      { status: 401 }
    );
  }

  const passwordMatch = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatch) {
    return NextResponse.json(
      { error: "密码错误" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      tag: user.tag,
      full_username: user.full_username
    }
  });

}