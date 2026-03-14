"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Mode = "login" | "register" | "guest";

function LoginInner() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as Mode) || "login";

  const [mode, setMode] = useState<Mode>(initialMode);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginTag, setLoginTag] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: loginUsername,
        tag: loginTag,
        password: loginPassword,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setMessage(data.error);
      return;
    }

    localStorage.setItem("user_id", data.user.id);
    window.location.href = "/write";
  }

  async function handleRegister() {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify({
        username: registerUsername,
        password: registerPassword,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setMessage(data.error);
      return;
    }

    setMessage("注册成功，请登录");
    setMode("login");
  }

  return (
    <main className="p-24 max-w-xl mx-auto">
      <Link href="/" className="text-blue-500 mb-6 inline-block">
        ← 返回首页
      </Link>

      <h1 className="text-3xl mb-6">进入 AI Diary</h1>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setMode("login")}>登录</button>
        <button onClick={() => setMode("register")}>注册</button>
        <button onClick={() => setMode("guest")}>路人体验</button>
      </div>

      {mode === "login" && (
        <div className="border p-6 rounded-lg">
          <h2 className="mb-4 text-xl">登录</h2>

          <input
            placeholder="用户名"
            className="border p-2 w-full mb-3"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
          />

          <input
            placeholder="Tag"
            className="border p-2 w-full mb-3"
            value={loginTag}
            onChange={(e) => setLoginTag(e.target.value)}
          />

          <input
            type="password"
            placeholder="密码"
            className="border p-2 w-full mb-3"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </div>
      )}

      {mode === "register" && (
        <div className="border p-6 rounded-lg">
          <h2 className="mb-4 text-xl">注册</h2>

          <input
            placeholder="用户名"
            className="border p-2 w-full mb-3"
            value={registerUsername}
            onChange={(e) => setRegisterUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="密码"
            className="border p-2 w-full mb-3"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
          />

          <button
            onClick={handleRegister}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {loading ? "注册中..." : "注册"}
          </button>
        </div>
      )}

      {mode === "guest" && (
        <div>
          <button
            onClick={() => {
              localStorage.setItem("guest", "true");
              window.location.href = "/write";
            }}
          >
            进入体验
          </button>
        </div>
      )}

      {message && <p className="mt-4 text-red-500">{message}</p >}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}