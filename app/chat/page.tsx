"use client";

import Link from "next/link";
import { useState } from "react";
import { getCurrentRecords, saveCurrentRecords } from "@/lib/storage";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type DiaryRecord = {
  id: number;
  day: string;
  time: string;
  content: string;
  entrySummary: string;
  dailySummary: string;
  summary: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "今天过得怎么样？可以随便聊聊。",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [entrySummary, setEntrySummary] = useState("");
  const [dailySummary, setDailySummary] = useState("");
  const [previewRecord, setPreviewRecord] = useState<DiaryRecord | null>(null);

  const resetChatToInitial = () => {
    setMessages([
      {
        role: "assistant",
        content: "今天过得怎么样？可以随便聊聊。",
      },
    ]);
    setInput("");
    setEntrySummary("");
    setDailySummary("");
    setPreviewRecord(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages: Message[] = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
        }),
      });

      const data = await res.json();

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.reply || "我刚刚有点卡住了，再说一句试试。",
        },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "请求失败，请稍后再试。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateChatRecord = async () => {
    const validMessages = messages.filter(
      (m) =>
        !(
          m.role === "assistant" &&
          m.content === "今天过得怎么样？可以随便聊聊。"
        )
    );

    const userMessages = validMessages.filter((m) => m.role === "user");

    if (userMessages.length === 0) {
      alert("还没有可以生成记录的聊天内容");
      return;
    }

    setSummaryLoading(true);
    setEntrySummary("");
    setDailySummary("");
    setPreviewRecord(null);

    try {
      const fullConversation = validMessages
        .map((m) => (m.role === "user" ? `我：${m.content}` : `AI：${m.content}`))
        .join("\n");

      const userOnlyContent = userMessages.map((m) => m.content).join("\n");

      const oldRecords: DiaryRecord[] = getCurrentRecords();

      const now = new Date();
      const today = now.toISOString().split("T")[0];

      const todayRecords = oldRecords.filter((record) => record.day === today);

      const todayUserOnlyContent = [
        ...todayRecords.map((record) => {
          const lines = record.content.split("\n");
          return lines
            .filter((line) => line.startsWith("我："))
            .map((line) => line.replace(/^我：/, ""))
            .join("\n");
        }),
        userOnlyContent,
      ]
        .filter(Boolean)
        .join("\n");

      const entryRes = await fetch("/api/entry-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: userOnlyContent }),
      });

      const entryData = await entryRes.json();

      if (!entryRes.ok) {
        setEntrySummary(entryData.error || "本次聊天总结生成失败");
        return;
      }

      const dailyRes = await fetch("/api/daily-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: todayUserOnlyContent }),
      });

      const dailyData = await dailyRes.json();

      if (!dailyRes.ok) {
        setEntrySummary(entryData.summary || "");
        setDailySummary(dailyData.error || "今日整合总结生成失败");
        return;
      }

      const record: DiaryRecord = {
        id: Date.now(),
        day: today,
        time: now.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        content: fullConversation,
        entrySummary: entryData.summary,
        dailySummary: dailyData.summary,
        summary: dailyData.summary,
      };

      setEntrySummary(entryData.summary);
      setDailySummary(dailyData.summary);
      setPreviewRecord(record);
    } catch {
      setEntrySummary("生成失败，请稍后再试。");
      setDailySummary("");
      setPreviewRecord(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSaveChatRecord = () => {
    if (!previewRecord) return;

    const oldRecords: DiaryRecord[] = getCurrentRecords();
    const newRecords = [previewRecord, ...oldRecords];
    saveCurrentRecords(newRecords);

    alert("已保存这段聊天");
    resetChatToInitial();
  };

  const handleDeleteChatPreview = () => {
    const ok = window.confirm("确定要删除这次聊天记录吗？");
    if (!ok) return;

    resetChatToInitial();
  };

  const handleClearChat = () => {
    const ok = window.confirm("确定要清空当前聊天吗？");
    if (!ok) return;

    resetChatToInitial();
  };

  return (
    <main className="p-24 max-w-3xl mx-auto">
      <Link href="/" className="text-blue-500 mb-6 inline-block">
        ← 返回首页
      </Link>

      <h1 className="text-3xl font-bold mb-6">和AI聊聊今天</h1>

      <div className="border rounded-lg p-4 h-[450px] overflow-y-auto bg-gray-50 space-y-4">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
            <div
              className={
                m.role === "user"
                  ? "inline-block bg-black text-white px-4 py-2 rounded-lg whitespace-pre-line"
                  : "inline-block bg-white border px-4 py-2 rounded-lg whitespace-pre-line"
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && <div>AI正在回复...</div>}
      </div>

      <div className="flex gap-3 mt-4">
        <input
          className="flex-1 border rounded-lg px-4 py-2"
          placeholder="说点什么..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          发送
        </button>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleGenerateChatRecord}
          disabled={summaryLoading}
          className="px-6 py-2 border rounded-lg disabled:opacity-50"
        >
          {summaryLoading ? "生成中..." : "生成聊天记录"}
        </button>

        <button
          onClick={handleClearChat}
          className="px-6 py-2 border rounded-lg"
        >
          清空聊天
        </button>
      </div>

      {(entrySummary || dailySummary) && (
        <div className="mt-8 space-y-6">
          {entrySummary && (
            <div className="border rounded-lg p-6 bg-gray-50">
              <h2 className="text-xl font-semibold mb-3">本次聊天总结</h2>
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
              onClick={handleSaveChatRecord}
              className="px-6 py-3 bg-black text-white rounded-lg"
            >
              保存这段聊天
            </button>

            <button
              onClick={handleDeleteChatPreview}
              className="px-6 py-3 border rounded-lg"
            >
              删除这次聊天记录
            </button>
          </div>
        </div>
      )}
    </main>
  );
}