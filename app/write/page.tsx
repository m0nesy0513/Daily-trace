"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getCurrentRecords, saveCurrentRecords } from "@/lib/storage";

type DiaryRecord = {
  id: string | number;
  day: string;
  time: string;
  content: string;
  entry_summary?: string;
  daily_summary?: string;
  entrySummary?: string;
  dailySummary?: string;
  summary?: string;
};

function getCurrentUser() {
  if (typeof window === "undefined") return null;

  const savedUser = localStorage.getItem("user");
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

async function getTodayRecords() {
  const user = getCurrentUser();

  if (!user?.id) {
    return getCurrentRecords();
  }

  const res = await fetch(`/api/record/list?user_id=${user.id}`);
  const data = await res.json();
  return data.data || [];
}

export default function WritePage() {
  const [content, setContent] = useState("");
  const [entrySummary, setEntrySummary] = useState("");
  const [dailySummary, setDailySummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<any>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  const handleRevealTrace = async () => {
    if (!content.trim()) {
      setEntrySummary("你还没有输入今天的内容。");
      setDailySummary("");
      setPreviewRecord(null);
      return;
    }

    setLoading(true);
    setEntrySummary("");
    setDailySummary("");
    setPreviewRecord(null);

    try {
      const oldRecords: DiaryRecord[] = await getTodayRecords();

      const today = new Date().toISOString().split("T")[0];
      const todayRecords = oldRecords.filter((record) => record.day === today);

      const allContent = [
        ...todayRecords.map((record) => record.content),
        content,
      ].join("\n");

      const entryRes = await fetch("/api/entry-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const entryData = await entryRes.json();

      if (!entryRes.ok) {
        setEntrySummary(entryData.error || "本条记录总结生成失败");
        return;
      }

      const dailyRes = await fetch("/api/daily-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: allContent }),
      });

      const dailyData = await dailyRes.json();

      if (!dailyRes.ok) {
        setEntrySummary(entryData.summary || "");
        setDailySummary(dailyData.error || "今日整合总结生成失败");
        return;
      }

      const now = new Date();

      setEntrySummary(entryData.summary);
      setDailySummary(dailyData.summary);
      setPreviewRecord({
        id: Date.now(),
        day: today,
        time: now.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        content,
        entrySummary: entryData.summary,
        dailySummary: dailyData.summary,
        summary: dailyData.summary,
      });

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch {
      setEntrySummary("请求失败，请稍后再试。");
      setDailySummary("");
      setPreviewRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!previewRecord) return;

    const user = getCurrentUser();

    try {
      if (user?.id) {
        const res = await fetch("/api/record/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            content: previewRecord.content,
            entry_summary: previewRecord.entrySummary,
            daily_summary: previewRecord.dailySummary,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "保存失败");
          return;
        }
      } else {
        const oldRecords = getCurrentRecords();
        const newRecords = [previewRecord, ...oldRecords];
        saveCurrentRecords(newRecords);
      }

      alert("已保存这条记录");

      setContent("");
      setEntrySummary("");
      setDailySummary("");
      setPreviewRecord(null);
    } catch {
      alert("请求失败");
    }
  };

  const handleDeletePreview = () => {
    const ok = window.confirm("确定要删除这次记录吗？");
    if (!ok) return;

    setContent("");
    setEntrySummary("");
    setDailySummary("");
    setPreviewRecord(null);
  };

  const handleClearInput = () => {
    const ok = window.confirm("确定要清空当前输入吗？");
    if (!ok) return;

    setContent("");
  };

  return (
    <main className="p-24 max-w-3xl mx-auto">
      <Link href="/" className="text-blue-500 mb-6 inline-block">
        ← 返回首页
      </Link>

      <h1 className="text-3xl font-bold mb-6">写下今天</h1>

      <textarea
        className="w-full h-60 border p-4 rounded-lg"
        placeholder="今天发生了什么..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleRevealTrace}
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded-lg disabled:opacity-50"
        >
          {loading ? "揭晓中..." : "揭晓痕迹"}
        </button>

        <button
          onClick={handleClearInput}
          className="px-6 py-3 border rounded-lg"
        >
          清空输入
        </button>
      </div>

      {(entrySummary || dailySummary) && (
        <div ref={resultRef} className="mt-8 space-y-6">
          {entrySummary && (
            <div className="border rounded-lg p-6 bg-gray-50">
              <h2 className="text-xl font-semibold mb-3">本条记录总结</h2>
              <p className="whitespace-pre-line leading-relaxed">
                {entrySummary}
              </p >
            </div>
          )}

          {dailySummary && (
            <div className="border rounded-lg p-6 bg-gray-50">
              <h2 className="text-xl font-semibold mb-3">今日整合总结</h2>
              <p className="whitespace-pre-line leading-relaxed">
                {dailySummary}
              </p >
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleSaveRecord}
              className="px-6 py-3 bg-black text-white rounded-lg"
            >
              保存这条记录
            </button>

            <button
              onClick={handleDeletePreview}
              className="px-6 py-3 border rounded-lg"
            >
              删除这次记录
            </button>
          </div>
        </div>
      )}
    </main>
  );
}