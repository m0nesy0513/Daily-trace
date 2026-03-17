"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type UserType = {
  id: string;
  username?: string;
  tag?: string;
};

type RecordType = {
  id: string;
  user_id?: string;
  day: string;
  time: string;
  content: string;
  entry_summary?: string;
  daily_summary?: string;
  created_at?: string;
};

function getNow() {
  const now = new Date();

  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;

  const time = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  return { day, time };
}

function getCurrentUser(): UserType | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isGuestMode() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("guest_mode") === "true";
}

function getGuestRecords(): RecordType[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem("guest_records");
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setGuestRecords(records: RecordType[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("guest_records", JSON.stringify(records));
}

export default function WritePage() {
  const [content, setContent] = useState("");
  const [entrySummary, setEntrySummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [message, setMessage] = useState("");

  const user = useMemo(() => getCurrentUser(), []);
  const guest = useMemo(() => isGuestMode(), []);

  const identityText = useMemo(() => {
    if (user) return `当前账号：${user.username}#${user.tag}`;
    if (guest) return "当前为路人体验模式";
    return "你还没有登录";
  }, [guest, user]);

  async function handleEntrySummary() {
    if (!content.trim()) {
      setMessage("先写一点内容再生成总结。");
      return;
    }

    setSummarizing(true);
    setMessage("");
    setEntrySummary("");

    try {
      const res = await fetch("/api/entry-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setEntrySummary(data.error || "生成失败");
        setSummarizing(false);
        return;
      }

      setEntrySummary(
        data.summary ||
        data.result ||
        data.text ||
        "已生成总结，但接口返回字段不是 summary。"
      );
    } catch {
      setEntrySummary("请求失败，请稍后再试。");
    } finally {
      setSummarizing(false);
    }
  }

  async function handleSave() {
    if (!content.trim()) {
      setMessage("内容不能为空。");
      return;
    }

    const { day, time } = getNow();

    setSaving(true);
    setMessage("");

    try {
      if (user?.id) {
        const res = await fetch("/api/record/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            day,
            time,
            content: content.trim(),
            entry_summary: entrySummary || "",
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          setMessage(data.error || "保存失败");
          setSaving(false);
          return;
        }
      } else if (guest) {
        const oldRecords = getGuestRecords();

        const newRecord: RecordType = {
          id: String(Date.now()),
          day,
          time,
          content: content.trim(),
          entry_summary: entrySummary || "",
        };

        setGuestRecords([newRecord, ...oldRecords]);
      } else {
        setMessage("请先登录或进入路人体验模式。");
        setSaving(false);
        return;
      }

      setMessage("保存成功。");
      setContent("");
      setEntrySummary("");
    } catch {
      setMessage("请求失败，请稍后再试。");
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setContent("");
    setEntrySummary("");
    setMessage("");
  }

  function handleDeleteCurrent() {
    setContent("");
    setEntrySummary("");
    setMessage("已清空本次内容。");
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← 返回首页
        </Link>

        <div className="mb-8">
          <div className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            AI Diary
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">写下今天</h1>
          <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
            先记录，再由 AI 帮你提炼今天。
          </p >
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            {identityText}
          </p >
        </div>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">今天的记录</h2>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              支持自由输入
            </span>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下今天发生的事、你的情绪、你在想什么……"
            className="min-h-[280px] w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-base leading-8 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-300"
          />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleEntrySummary}
              disabled={summarizing}
              className="rounded-2xl bg-zinc-900 px-5 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {summarizing ? "生成中..." : "揭晓痕迹"}
            </button>

            <button
              onClick={handleClear}
              className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              清空输入
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 text-lg font-semibold">本条记录总结</div>

          {entrySummary ? (
            <p className="whitespace-pre-line text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              {entrySummary}
            </p >
          ) : (
            <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              还没有生成总结。点击“揭晓痕迹”后，AI 会帮你提炼这一条记录。
            </p >
          )}
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl bg-zinc-900 px-5 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? "保存中..." : "保存这条记录"}
          </button>

          <button
            onClick={handleDeleteCurrent}
            className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            删除这次记录
          </button>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 text-sm leading-7 text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}