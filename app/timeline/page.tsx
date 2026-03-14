"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCurrentRecords } from "@/lib/storage";

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
  created_at?: string;
};

type MonthGroup = {
  month: string;
  records: DiaryRecord[];
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

function normalizeRecord(record: any): DiaryRecord {
  return {
    ...record,
    entrySummary: record.entrySummary || record.entry_summary || "",
    dailySummary: record.dailySummary || record.daily_summary || "",
    summary:
      record.summary ||
      record.dailySummary ||
      record.daily_summary ||
      "",
  };
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

function getCurrentMonthPrefix() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatMonthLabel(month: string) {
  const [y, m] = month.split("-");
  return `${y}年${m}月`;
}

function formatDayLabel(day: string) {
  const [y, m, d] = day.split("-");
  return `${m}月${d}日`;
}

export default function TimelinePage() {
  const [records, setRecords] = useState<DiaryRecord[]>([]);
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});

  const loadRecords = async () => {
    const user = getCurrentUser();

    if (user?.id) {
      const res = await fetch(`/api/record/list?user_id=${user.id}`);
      const data = await res.json();
      setRecords((data.data || []).map(normalizeRecord));
      return;
    }

    setRecords(getCurrentRecords().map(normalizeRecord));
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const aKey = `${a.day} ${a.time || ""}`;
      const bKey = `${b.day} ${b.time || ""}`;
      return bKey.localeCompare(aKey);
    });
  }, [records]);

  const uniqueDays = useMemo(() => {
    return Array.from(new Set(sortedRecords.map((r) => r.day))).sort((a, b) =>
      b.localeCompare(a)
    );
  }, [sortedRecords]);

  const totalRecordCount = sortedRecords.length;
  const totalDayCount = uniqueDays.length;

  const longestStreak = useMemo(() => {
    if (uniqueDays.length === 0) return 0;

    const sortedAsc = [...uniqueDays].sort((a, b) => a.localeCompare(b));

    let max = 1;
    let current = 1;

    for (let i = 1; i < sortedAsc.length; i++) {
      const prev = new Date(sortedAsc[i - 1]);
      const curr = new Date(sortedAsc[i]);

      const diff =
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        current += 1;
        max = Math.max(max, current);
      } else {
        current = 1;
      }
    }

    return max;
  }, [uniqueDays]);

  const currentStreak = useMemo(() => {
    if (uniqueDays.length === 0) return 0;

    const sortedDesc = [...uniqueDays].sort((a, b) => b.localeCompare(a));
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (sortedDesc[0] !== todayStr && sortedDesc[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 1;

    for (let i = 1; i < sortedDesc.length; i++) {
      const prev = new Date(sortedDesc[i - 1]);
      const curr = new Date(sortedDesc[i]);

      const diff =
        (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        streak += 1;
      } else {
        break;
      }
    }

    return streak;
  }, [uniqueDays]);

  const last7Days = useMemo(() => getLast7Days(), []);
  const weeklyRecords = useMemo(() => {
    return sortedRecords.filter((r) => last7Days.includes(r.day));
  }, [sortedRecords, last7Days]);

  const currentMonthPrefix = useMemo(() => getCurrentMonthPrefix(), []);
  const monthlyRecords = useMemo(() => {
    return sortedRecords.filter((r) => r.day.startsWith(currentMonthPrefix));
  }, [sortedRecords, currentMonthPrefix]);

  const weeklyKeywords = useMemo(() => {
    const words: Record<string, number> = {};

    weeklyRecords.forEach((r) => {
      const list = String(r.content)
        .replace(/[，。！？；：、,.!?;:]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 2);

      list.forEach((w) => {
        words[w] = (words[w] || 0) + 1;
      });
    });

    return Object.entries(words)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map((item) => item[0]);
  }, [weeklyRecords]);

  const weeklyTitle = useMemo(() => {
    if (weeklyRecords.length === 0) return "这一周还没有留下痕迹";
    if (weeklyKeywords.length === 0) return "平静推进的一周";
    return `围绕「${weeklyKeywords[0]}」展开的一周`;
  }, [weeklyRecords, weeklyKeywords]);

  const monthGroups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, DiaryRecord[]>();

    sortedRecords.forEach((record) => {
      const month = record.day.slice(0, 7);
      if (!map.has(month)) {
        map.set(month, []);
      }
      map.get(month)!.push(record);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, list]) => ({
        month,
        records: list,
      }));
  }, [sortedRecords]);

  const groupedByDayInMonth = (records: DiaryRecord[]) => {
    const map = new Map<string, DiaryRecord[]>();

    records.forEach((record) => {
      if (!map.has(record.day)) {
        map.set(record.day, []);
      }
      map.get(record.day)!.push(record);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([day, list]) => ({
        day,
        records: list.sort((a, b) =>
          String(a.time || "").localeCompare(String(b.time || ""))
        ),
      }));
  };

  const toggleDay = (day: string) => {
    setOpenDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  return (
    <main className="p-24 max-w-5xl mx-auto">
      <Link href="/" className="text-blue-500 mb-6 inline-block">
        ← 返回首页
      </Link>

      <h1 className="text-3xl font-bold mb-8">人生轨迹</h1>

      <div className="border rounded-lg p-6 bg-gray-50 mb-6">
        <div className="text-xl font-semibold mb-2">{weeklyTitle}</div>
        <p className="text-gray-600">
          你的记录不只是日记，而是在慢慢形成自己的时间线。
        </p >
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-5 bg-white text-center">
          <div className="text-2xl font-bold">{currentStreak}</div>
          <div className="text-gray-500 mt-1">当前连续天数</div>
        </div>

        <div className="border rounded-lg p-5 bg-white text-center">
          <div className="text-2xl font-bold">{longestStreak}</div>
          <div className="text-gray-500 mt-1">最长连续天数</div>
        </div>

        <div className="border rounded-lg p-5 bg-white text-center">
          <div className="text-2xl font-bold">{totalDayCount}</div>
          <div className="text-gray-500 mt-1">总记录天数</div>
        </div>

        <div className="border rounded-lg p-5 bg-white text-center">
          <div className="text-2xl font-bold">{totalRecordCount}</div>
          <div className="text-gray-500 mt-1">总记录条数</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="font-semibold mb-3">本周概览</div>
          <p className="text-gray-700 mb-2">最近 7 天共 {weeklyRecords.length} 条记录</p >
          <p className="text-gray-700">涉及 {new Set(weeklyRecords.map((r) => r.day)).size} 天</p >
        </div>

        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="font-semibold mb-3">本月概览</div>
          <p className="text-gray-700 mb-2">本月共 {monthlyRecords.length} 条记录</p >
          <p className="text-gray-700">
            记录天数 {new Set(monthlyRecords.map((r) => r.day)).size} 天
          </p >
        </div>
      </div>

      {weeklyKeywords.length > 0 && (
        <div className="border rounded-lg p-6 bg-gray-50 mb-10">
          <div className="font-semibold mb-3">本周关键词</div>
          <div className="flex flex-wrap gap-3">
            {weeklyKeywords.map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1 border rounded-full text-sm bg-white"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {monthGroups.length === 0 ? (
          <div className="border rounded-lg p-8 bg-white text-gray-500">
            还没有记录，先去写下今天吧。
          </div>
        ) : (
          monthGroups.map((monthGroup) => {
            const dayGroups = groupedByDayInMonth(monthGroup.records);

            return (
              <section
                key={monthGroup.month}
                className="border rounded-lg p-6 bg-white"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">
                    {formatMonthLabel(monthGroup.month)}
                  </h2>
                  <div className="text-gray-500 text-sm">
                    共 {monthGroup.records.length} 条记录 · {dayGroups.length} 天
                  </div>
                </div>

                <div className="space-y-4">
                  {dayGroups.map((group) => {
                    const latestSummary =
                      group.records[group.records.length - 1]?.summary || "";

                    return (
                      <div
                        key={group.day}
                        className="border rounded-lg p-5 bg-gray-50"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="font-semibold">
                              {group.day} · {formatDayLabel(group.day)}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              这一天共 {group.records.length} 条记录
                            </div>
                          </div>

                          <button
                            onClick={() => toggleDay(group.day)}
                            className="px-4 py-2 border rounded-lg text-sm"
                          >
                            {openDays[group.day] ? "收起" : "展开"}
                          </button>
                        </div>

                        {latestSummary && (
                          <div className="mt-4 border rounded-lg p-4 bg-white">
                            <div className="text-sm font-semibold mb-2">当日总结</div>
                            <p className="whitespace-pre-line leading-relaxed text-gray-700">
                              {latestSummary}
                            </p >
                          </div>
                        )}

                        {openDays[group.day] && (
                          <div className="mt-4 space-y-3">
                            {group.records.map((record, index) => (
                              <div
                                key={`${record.id}-${index}`}
                                className="border rounded-lg p-4 bg-white"
                              >
                                <div className="text-sm text-gray-500 mb-2">
                                  {String(record.time).slice(0, 5)} · 第 {index + 1} 条
                                </div>
                                <div className="whitespace-pre-line leading-relaxed">
                                  {record.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}