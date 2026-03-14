"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type Mode = "login" | "register" | "guest";

export default function LoginPage() {
  const searchParams = useSearchParams();

  const initialMode = useMemo<Mode>(() => {
    const mode = searchParams.get("mode");

    if (mode === "register") return "register";
    if (mode === "guest") return "guest";
    return "login";
  }, [searchParams]);

  const [mode, setMode] = useState<Mode>(initialMode);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginTag, setLoginTag] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setMessage("");
  };

  const handleRegister = async () => {
    if (!registerUsername.trim() || !registerPassword.trim()) {
      setMessage("请先输入用户名和密码");
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

      if (!res.ok) {
        setMessage(data.error || "注册失败");
        return;
      }

      const fullUsername = data.full_username || "";
      const parts = fullUsername.split("#");
      const username = parts[0] || "";
      const tag = parts[1] || "";

      setMessage(
        `注册成功！

用户名：${username}
代号：${tag}
完整账号：${fullUsername}

请记住你的用户名和代号，登录时分别输入。`
      );

      setRegisterUsername("");
      setRegisterPassword("");
      setMode("login");
      setLoginUsername(username);
      setLoginTag(tag);
      setLoginPassword("");
    } catch {
      setMessage("请求失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
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

      if (!res.ok) {
        setMessage(data.error || "登录失败");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.removeItem("guest_mode");

      window.location.href = "/";
    } catch {
      setMessage("请求失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    localStorage.setItem("guest_mode", "true");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <main className="p-24 max-w-2xl mx-auto">
      <Link href="/" className="text-blue-500 mb-6 inline-block">
        ← 返回首页
      </Link>

      <h1 className="text-3xl font-bold mb-3">进入 AI Diary</h1>

      <p className="text-gray-600 mb-8">
        记录、对话、沉淀你的人生。选择一种方式进入。
      </p >

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => switchMode("login")}
          className={`px-5 py-2 rounded-lg border ${
            mode === "login" ? "bg-black text-white" : ""
          }`}
        >
          登录
        </button>

        <button
          onClick={() => switchMode("register")}
          className={`px-5 py-2 rounded-lg border ${
            mode === "register" ? "bg-black text-white" : ""
          }`}
        >
          注册
        </button>

        <button
          onClick={() => switchMode("guest")}
          className={`px-5 py-2 rounded-lg border ${
            mode === "guest" ? "bg-black text-white" : ""
          }`}
        >
          路人体验
        </button>
      </div>

      {mode === "login" && (
        <div className="border rounded-lg p-6 bg-gray-50 space-y-4">
          <h2 className="text-xl font-semibold">登录</h2>

          <input
            className="w-full border rounded-lg px-4 py-3"
            placeholder="用户名"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
          />

          <input
            className="w-full border rounded-lg px-4 py-3"
            placeholder="代号"
            value={loginTag}
            onChange={(e) => setLoginTag(e.target.value.toUpperCase())}
          />

          <input
            className="w-full border rounded-lg px-4 py-3"
            placeholder="密码"
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />

          <div className="text-sm text-gray-500">
            登录格式：用户名 与代号分开输入，例如「清樾」和「A7K2」
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="px-6 py-3 bg-black text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </div>
      )}

      {mode === "register" && (
        <div className="border rounded-lg p-6 bg-gray-50 space-y-4">
          <h2 className="text-xl font-semibold">注册</h2>

          <input
            className="w-full border rounded-lg px-4 py-3"
            placeholder="用户名（不用输入代号）"
            value={registerUsername}
            onChange={(e) => setRegisterUsername(e.target.value)}
          />

          <input
            className="w-full border rounded-lg px-4 py-3"
            placeholder="密码（至少 6 位）"
            type="password"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
          />

          <div className="text-sm text-gray-500">
            注册后系统会自动为你分配专属代号。
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="px-6 py-3 bg-black text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "注册中..." : "注册"}
          </button>
        </div>
      )}

      {mode === "guest" && (
        <div className="border rounded-lg p-6 bg-gray-50 space-y-4">
          <h2 className="text-xl font-semibold">路人体验</h2>

          <p className="text-gray-600 leading-relaxed">
            不登录也可以先体验记录、聊天和总结功能。
            路人模式下的数据仅用于临时体验，退出后会自动清除。
          </p >

          <button
            onClick={handleGuest}
            className="px-6 py-3 bg-black text-white rounded-lg"
          >
            进入体验
          </button>
        </div>
      )}

      {message && (
        <div className="mt-6 border rounded-lg p-4 bg-white whitespace-pre-line leading-relaxed">
          {message}
        </div>
      )}
    </main>
  );
}