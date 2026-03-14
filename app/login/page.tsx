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
    if (!loginUsername.trim() || !loginTag.trim() || !loginPassword.trim()) {
      setMessage("请输入用户名、代号和密码");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: loginUsername.trim(),
          tag: loginTag.trim().toUpperCase(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || data.error) {
        setMessage(data.error || "登录失败");
        return;
      }

      // 存完整用户信息，后面 history / write / timeline 都更方便用
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.removeItem("guest_mode");

      window.location.href = "/";
    } catch {
      setLoading(false);
      setMessage("请求失败，请稍后再试。");
    }
  }

  async function handleRegister() {
    if (!registerUsername.trim() || !registerPassword.trim()) {
      setMessage("请输入用户名和密码");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: registerUsername.trim(),
          password: registerPassword,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || data.error) {
        setMessage(data.error || "注册失败");
        return;
      }

      // 注册成功后显示 tag，并自动填入登录框
      setMessage(
        `注册成功！

用户名：${data.username}
代号：${data.tag}
完整账号：${data.full_username}

请记住你的用户名和代号，登录时分别输入。`
      );

      setLoginUsername(data.username || "");
      setLoginTag((data.tag || "").toUpperCase());
      setLoginPassword("");

      setRegisterUsername("");
      setRegisterPassword("");

      setMode("login");
    } catch {
      setLoading(false);
      setMessage("请求失败，请稍后再试。");
    }
  }

  function handleGuest() {
    localStorage.setItem("guest_mode", "true");
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  return (
    <main className="p-24 max-w-xl mx-auto">
      <Link href="/" className="text-blue-500 mb-6 inline-block">
        ← 返回首页
      </Link>

      <h1 className="text-3xl mb-6">进入 AI Diary</h1>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => {
            setMode("login");
            setMessage("");
          }}
          className="border px-4 py-2 rounded"
        >
          登录
        </button>

        <button
          onClick={() => {
            setMode("register");
            setMessage("");
          }}
          className="border px-4 py-2 rounded"
        >
          注册
        </button>

        <button
          onClick={() => {
            setMode("guest");
            setMessage("");
          }}
          className="border px-4 py-2 rounded"
        >
          路人体验
        </button>
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
            placeholder="代号"
            className="border p-2 w-full mb-3"
            value={loginTag}
            onChange={(e) => setLoginTag(e.target.value.toUpperCase())}
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
            disabled={loading}
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
            disabled={loading}
          >
            {loading ? "注册中..." : "注册"}
          </button>
        </div>
      )}

      {mode === "guest" && (
        <div className="border p-6 rounded-lg">
          <h2 className="mb-4 text-xl">路人体验</h2>

          <p className="mb-4 text-gray-600">
            不登录也可以先体验记录、聊天和总结功能。退出体验后，路人数据会自动清除。
          </p >

          <button
            onClick={handleGuest}
            className="bg-black text-white px-4 py-2 rounded"
          >
            进入体验
          </button>
        </div>
      )}

      {message && <p className="mt-4 text-red-500 whitespace-pre-line">{message}</p >}
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