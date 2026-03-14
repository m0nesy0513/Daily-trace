"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCurrentRecords } from "@/lib/storage";

type DiaryRecord = {
  id: string | number;
  day: string;
  time: string;
  content: string;
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

function getLast7Days() {
  const result: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split("T")[0]);
  }

  return result;
}

export default function ReviewPage() {
  const [records, setRecords] = useState<DiaryRecord[]>([]);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);

  const loadRecords = async () => {
    const user = getCurrentUser();

    if (user?.id) {
      const res = await fetch(`/api/record/list?user_id=${user.id}`);
      const data = await res.json();
      setRecords(data.data || []);
      return;
    }

    setRecords(getCurrentRecords());
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const last7Days = useMemo(() => getLast7Days(), []);

  const weeklyRecords = useMemo(() => {
    return records.filter((r) => last7Days.includes(r.day));
  }, [records, last7Days]);

  const daysWithRecords = new Set(weeklyRecords.map((r) => r.day));

  const totalRecords = weeklyRecords.length;
  const activeDays = daysWithRecords.size;

  const longestStreak = useMemo(() => {
    let streak = 0;
    let max = 0;

    for (const day of last7Days) {
      if (daysWithRecords.has(day)) {
        streak++;
        max = Math.max(max, streak);
      } else {
        streak = 0;
      }
    }

    return max;
  }, [daysWithRecords, last7Days]);

  const keywords = useMemo(() => {
    const words: Record<string, number> = {};

    weeklyRecords.forEach((r) => {
      const list = r.content
        .replace(/[，。！？,.!?]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 2);

      list.forEach((w) => {
        words[w] = (words[w] || 0) + 1;
      });
    });

    return Object.entries(words)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((w) => w[0]);
  }, [weeklyRecords]);

  const weeklyText = useMemo(() => {
    return weeklyRecords
      .map((r) => `${r.day} ${r.time} ${r.content}`)
      .join("\n");
  }, [weeklyRecords]);

  const handleGenerateReview = async () => {
    if (!weeklyText) {
      setReview("最近7天没有记录。");
      return;
    }

    setLoading(true);
    setReview("");

    try {
      const res = await fetch("/api/review-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: weeklyText }),
      });

      const data = await res.json();

      setReview(data.summary || "生成失败");
    } catch {
      setReview("请求失败");
    } finally {
      setLoading(false);
    }
  };

  const weeklyTitle = useMemo(() => {
    if (keywords.length === 0) return "平静的一周";

    return `关于 ${keywords[0]} 的一周`;
  }, [keywords]);

  return (
    <main className="p-24 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-500 mb-6 inline-block">
        ← 返回首页
      </Link>

      <h1 className="text-3xl font-bold mb-8">本周回顾</h1>

      {/* 标题 */}
      <div className="border rounded-lg p-6 bg-gray-50 mb-6">
        <div className="text-xl font-semibold">{weeklyTitle}</div>
      </div>

      {/* 统计 */}
      <div className="border rounded-lg p-6 bg-gray-50 mb-6">
        <div className="grid grid-cols-3 gap-6 text-center">

          <div>
            <div className="text-2xl font-bold">{activeDays}</div>
            <div className="text-gray-500">记录天数</div>
          </div>

          <div>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <div className="text-gray-500">总记录数</div>
          </div>

          <div>
            <div className="text-2xl font-bold">{longestStreak}</div>
            <div className="text-gray-500">连续天数</div>
          </div>

        </div>
      </div>

      {/* 关键词 */}
      {keywords.length > 0 && (
        <div className="border rounded-lg p-6 bg-gray-50 mb-6">
          <div className="font-semibold mb-3">本周关键词</div>

          <div className="flex gap-3 flex-wrap">
            {keywords.map((k) => (
              <div
                key={k}
                className="px-3 py-1 border rounded-full text-sm"
              >
                {k}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI总结 */}
      <div className="mb-6">
        <button
          onClick={handleGenerateReview}
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded-lg disabled:opacity-50"
        >
          {loading ? "生成中..." : "生成本周回顾"}
        </button>
      </div>

      {review && (
        <div className="border rounded-lg p-6 bg-gray-50 mb-10">
          <h2 className="text-xl font-semibold mb-3">AI 总结</h2>
          <p className="whitespace-pre-line leading-relaxed">{review}</p >
        </div>
      )}
    </main>
  );
}