"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clearGuestRecords, getCurrentRecords, isGuestMode } from "@/lib/storage";

type RecordType = {
  day: string;
  time: string;
  content: string;
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [guest, setGuest] = useState(false);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }

    setGuest(isGuestMode());

    const load = async () => {
      if (savedUser) {
        const u = JSON.parse(savedUser);

        const res = await fetch(`/api/record/list?user_id=${u.id}`);
        const data = await res.json();

        setRecords(data.data || []);
      } else {
        setRecords(getCurrentRecords());
      }

      setReady(true);
    };

    load();
  }, []);

  const days = useMemo(() => {
    const set = new Set(records.map((r) => r.day));
    return Array.from(set).sort();
  }, [records]);

  const totalDays = days.length;

  const currentStreak = useMemo(() => {
    if (days.length === 0) return 0;

    const sorted = [...days].sort((a, b) => b.localeCompare(a));

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) return 0;

    let streak = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);

      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);

      if (diff === 1) streak++;
      else break;
    }

    return streak;
  }, [days]);

  const longestStreak = useMemo(() => {
    if (days.length === 0) return 0;

    const sorted = [...days].sort();

    let max = 1;
    let current = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);

      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        current++;
        max = Math.max(max, current);
      } else {
        current = 1;
      }
    }

    return max;
  }, [days]);

  const weeklyTitle = useMemo(() => {
    if (records.length === 0) return "你的轨迹还未开始";

    const text = records
      .slice(-20)
      .map((r) => r.content)
      .join(" ");

    const words = text
      .replace(/[，。！？,.!?]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    const map: any = {};

    words.forEach((w) => {
      map[w] = (map[w] || 0) + 1;
    });

    const sorted = Object.entries(map).sort((a: any, b: any) => b[1] - a[1]);

    if (sorted.length === 0) return "平静推进的一周";

    return `围绕「${sorted[0][0]}」展开的一周`;
  }, [records]);

  const logout = () => {
    if (guest) {
      clearGuestRecords();
      localStorage.removeItem("guest_mode");
    }

    localStorage.removeItem("user");

    window.location.href = "/";
  };

  if (!ready) return null;

  const hasIdentity = user || guest;

  return (
    <main className="p-24 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">AI Diary</h1>

      {!hasIdentity && (
        <>
          <p className="text-gray-600 mb-8">
            记录、对话、沉淀你的人生。
          </p >

          <div className="grid gap-4 mb-10">

            <Link href="/login?mode=login" className="border rounded-lg p-4 hover:bg-gray-50">
              登录
            </Link>

            <Link href="/login?mode=register" className="border rounded-lg p-4 hover:bg-gray-50">
              注册
            </Link>

            <button
              onClick={() => {
                localStorage.setItem("guest_mode", "true");
                window.location.href = "/";
              }}
              className="border rounded-lg p-4 text-left hover:bg-gray-50"
            >
              路人体验
            </button>

          </div>
        </>
      )}

      {hasIdentity && (
        <>
          {user && (
            <p className="text-gray-600 mb-6">
              欢迎回来，{user.username}#{user.tag}
            </p >
          )}

          {guest && (
            <p className="text-gray-600 mb-6">
              当前为路人体验模式
            </p >
          )}

          <div className="border rounded-lg p-6 bg-gray-50 mb-6">

            <div className="text-xl font-semibold mb-2">
              已连续记录 {currentStreak} 天
            </div>

            <p className="text-gray-600">
              人生轨迹正在形成
            </p >

          </div>

          <div className="grid grid-cols-3 gap-4 mb-8 text-center">

            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold">{currentStreak}</div>
              <div className="text-gray-500 text-sm">当前连续</div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold">{longestStreak}</div>
              <div className="text-gray-500 text-sm">最长连续</div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold">{totalDays}</div>
              <div className="text-gray-500 text-sm">记录天数</div>
            </div>

          </div>

          <div className="border rounded-lg p-6 bg-gray-50 mb-8">

            <div className="font-semibold mb-2">
              本周状态
            </div>

            <p className="text-gray-700">
              {weeklyTitle}
            </p >

          </div>

          <div className="grid gap-4 mb-8">

            <Link href="/write" className="border rounded-lg p-4 hover:bg-gray-50">
              写下今天
            </Link>

            <Link href="/chat" className="border rounded-lg p-4 hover:bg-gray-50">
              AI聊天
            </Link>

            <Link href="/history" className="border rounded-lg p-4 hover:bg-gray-50">
              历史记录
            </Link>

            <Link href="/review" className="border rounded-lg p-4 hover:bg-gray-50">
              本周回顾
            </Link>

            <Link href="/timeline" className="border rounded-lg p-4 hover:bg-gray-50">
              人生轨迹
            </Link>

          </div>

          <button
            onClick={logout}
            className="text-sm text-gray-500 underline"
          >
            退出
          </button>
        </>
      )}
    </main>
  );
}