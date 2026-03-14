"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  clearGuestRecords,
  getCurrentRecords,
  isGuestMode,
  saveCurrentRecords,
} from "@/lib/storage";

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

type GroupedRecords = {
  groupId: string;
  day: string;
  records: DiaryRecord[];
  latestSummary: string;
};

type ChatLine = {
  role: "user" | "assistant";
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

export default function HistoryPage() {
  const [records, setRecords] = useState<DiaryRecord[]>([]);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedRecordIdsByDay, setSelectedRecordIdsByDay] = useState<
    Record<string, (string | number)[]>
  >({});

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

  const persistGuestRecords = (newRecords: DiaryRecord[]) => {
    setRecords(newRecords);
    saveCurrentRecords(newRecords);
  };

  const isChatContent = (content: string) => {
    return content.includes("我：") || content.includes("AI：");
  };

  const parseChatContent = (content: string): ChatLine[] => {
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const result: ChatLine[] = [];

    for (const line of lines) {
      if (line.startsWith("我：")) {
        result.push({
          role: "user",
          content: line.replace(/^我：/, ""),
        });
      } else if (line.startsWith("AI：")) {
        result.push({
          role: "assistant",
          content: line.replace(/^AI：/, ""),
        });
      } else {
        result.push({
          role: "assistant",
          content: line,
        });
      }
    }

    return result;
  };

  const handleDeleteSingleRecord = async (id: string | number) => {
    const confirmed = window.confirm("确定要删除这条记录吗？");
    if (!confirmed) return;

    const user = getCurrentUser();

    if (user?.id) {
      const res = await fetch("/api/record/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "single",
          user_id: user.id,
          record_id: id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "删除失败");
        return;
      }

      loadRecords();
      return;
    }

    const newRecords = records.filter((record) => record.id !== id);
    persistGuestRecords(newRecords);
  };

  const handleDeleteWholeDay = async (day: string) => {
    const confirmed = window.confirm(`确定要删除 ${day} 这一天的全部记录吗？`);
    if (!confirmed) return;

    const user = getCurrentUser();

    if (user?.id) {
      const res = await fetch("/api/record/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "day",
          user_id: user.id,
          day,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "删除失败");
        return;
      }

      loadRecords();
    } else {
      const newRecords = records.filter((record) => record.day !== day);
      persistGuestRecords(newRecords);
    }

    setSelectedDays((prev) => prev.filter((d) => d !== day));
    setSelectedRecordIdsByDay((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });

    if (openDay === day) {
      setOpenDay(null);
    }
  };

  const toggleSelectDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleBatchDeleteDays = async () => {
    if (selectedDays.length === 0) {
      alert("你还没有选中任何日期");
      return;
    }

    const confirmed = window.confirm(
      `确定要删除选中的 ${selectedDays.length} 天全部记录吗？`
    );
    if (!confirmed) return;

    const user = getCurrentUser();

    if (user?.id) {
      const res = await fetch("/api/record/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "days",
          user_id: user.id,
          days: selectedDays,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "删除失败");
        return;
      }

      loadRecords();
    } else {
      const newRecords = records.filter(
        (record) => !selectedDays.includes(record.day)
      );
      persistGuestRecords(newRecords);
    }

    if (openDay && selectedDays.includes(openDay)) {
      setOpenDay(null);
    }

    setSelectedDays([]);
  };

  const toggleSelectRecord = (day: string, id: string | number) => {
    setSelectedRecordIdsByDay((prev) => {
      const current = prev[day] || [];
      const nextForDay = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];

      return {
        ...prev,
        [day]: nextForDay,
      };
    });
  };

  const toggleSelectAllRecordsInDay = (
    day: string,
    ids: (string | number)[]
  ) => {
    setSelectedRecordIdsByDay((prev) => {
      const current = prev[day] || [];
      const allSelected = ids.length > 0 && ids.every((id) => current.includes(id));

      return {
        ...prev,
        [day]: allSelected ? [] : ids,
      };
    });
  };

  const handleBatchDeleteRecordsInDay = async (day: string) => {
    const selectedIds = selectedRecordIdsByDay[day] || [];

    if (selectedIds.length === 0) {
      alert("这一天还没有选中任何记录");
      return;
    }

    const confirmed = window.confirm(
      `确定要删除 ${day} 中选中的 ${selectedIds.length} 条记录吗？`
    );
    if (!confirmed) return;

    const user = getCurrentUser();

    if (user?.id) {
      const res = await fetch("/api/record/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "records",
          user_id: user.id,
          record_ids: selectedIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "删除失败");
        return;
      }

      loadRecords();
    } else {
      const newRecords = records.filter(
        (record) => !selectedIds.includes(record.id)
      );
      persistGuestRecords(newRecords);
    }

    setSelectedRecordIdsByDay((prev) => ({
      ...prev,
      [day]: [],
    }));
  };

  const groupedRecords = useMemo<GroupedRecords[]>(() => {
    const groupedMap = new Map<string, DiaryRecord[]>();

    for (const record of records) {
      if (!groupedMap.has(record.day)) {
        groupedMap.set(record.day, []);
      }
      groupedMap.get(record.day)!.push(record);
    }

    return Array.from(groupedMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([day, dayRecords]) => {
        const sortedRecords = [...dayRecords].sort((a, b) => {
          return String(a.time).localeCompare(String(b.time));
        });

        const latestSummary =
          sortedRecords[sortedRecords.length - 1]?.summary || "";

        return {
          groupId: `group-${day}`,
          day,
          records: sortedRecords,
          latestSummary,
        };
      });
  }, [records]);

  return (
    <main className="p-24 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-500 mb-6 inline-block">
        ← 返回首页
      </Link>

      <h1 className="text-3xl font-bold mb-8">历史记录</h1>

      <div className="mb-6 flex gap-4">
        <button
          onClick={handleBatchDeleteDays}
          className="px-5 py-2 border rounded-lg"
        >
          批量删除选中日期
        </button>
      </div>

      {groupedRecords.length === 0 ? (
        <p className="text-gray-500">还没有记录</p >
      ) : (
        groupedRecords.map((group) => {
          const selectedIds = selectedRecordIdsByDay[group.day] || [];
          const allIds = group.records.map((record) => record.id);
          const allSelected =
            allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

          return (
            <div
              key={group.groupId}
              className="border rounded-lg p-6 mb-6 bg-gray-50"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(group.day)}
                      onChange={() => toggleSelectDay(group.day)}
                    />
                    <div className="text-lg font-semibold">{group.day}</div>
                  </div>

                  <div className="text-sm text-gray-600">
                    共 {group.records.length} 条记录
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    className="text-sm border rounded-lg px-3 py-2"
                    onClick={() =>
                      setOpenDay(openDay === group.day ? null : group.day)
                    }
                  >
                    {openDay === group.day ? "收起当天记录" : "查看当天记录"}
                  </button>

                  <button
                    className="text-sm border rounded-lg px-3 py-2"
                    onClick={() => handleDeleteWholeDay(group.day)}
                  >
                    删除整天
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <strong>当日总结</strong>
                <p className="mt-2 whitespace-pre-line leading-relaxed">
                  {group.latestSummary || "暂无总结"}
                </p >
              </div>

              {openDay === group.day && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex gap-3 mb-4">
                    <button
                      className="text-sm border rounded-lg px-3 py-2"
                      onClick={() =>
                        toggleSelectAllRecordsInDay(group.day, allIds)
                      }
                    >
                      {allSelected ? "取消全选当天记录" : "全选当天记录"}
                    </button>

                    <button
                      className="text-sm border rounded-lg px-3 py-2"
                      onClick={() => handleBatchDeleteRecordsInDay(group.day)}
                    >
                      删除当天选中记录
                    </button>
                  </div>

                  <div className="space-y-4">
                    {group.records.map((record, index) => {
                      const chatMode = isChatContent(record.content);
                      const chatLines = chatMode
                        ? parseChatContent(record.content)
                        : [];

                      return (
                        <div
                          key={`record-${record.id}-${index}`}
                          className="border rounded-lg p-4 bg-white"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(record.id)}
                                onChange={() =>
                                  toggleSelectRecord(group.day, record.id)
                                }
                              />
                              <div className="text-sm text-gray-500">
                                {String(record.time).slice(0, 5)} · 第 {index + 1} 条
                              </div>
                            </div>

                            <button
                              className="text-sm border rounded-lg px-3 py-1"
                              onClick={() => handleDeleteSingleRecord(record.id)}
                            >
                              删除这条
                            </button>
                          </div>

                          {chatMode ? (
                            <div className="space-y-3">
                              {chatLines.map((line, lineIndex) => (
                                <div
                                  key={`chat-line-${record.id}-${lineIndex}`}
                                  className={
                                    line.role === "user"
                                      ? "text-right"
                                      : "text-left"
                                  }
                                >
                                  <div
                                    className={
                                      line.role === "user"
                                        ? "inline-block bg-black text-white px-4 py-2 rounded-lg whitespace-pre-line"
                                        : "inline-block bg-gray-100 border px-4 py-2 rounded-lg whitespace-pre-line"
                                    }
                                  >
                                    {line.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="whitespace-pre-line leading-relaxed">
                              {record.content}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </main>
  );
}