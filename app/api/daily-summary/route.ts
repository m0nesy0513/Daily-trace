export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content = body.content;

    if (!content || !content.trim()) {
      return Response.json({ error: "内容不能为空" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "没有检测到 DeepSeek API Key" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是一个温和、理性、克制的日记整理助手。

你的任务是：根据“今天截至目前的全部记录内容”，生成一份今日整合总结。

必须严格按照下面格式输出，不要添加额外说明：

标题：
（一句话概括今天）

总结：
（用 3 到 4 句话总结今天发生的事情，语言自然，有整理感，不要只是重复原文）

情绪：
（只写 1 到 2 个情绪词，例如：开心、平静、疲惫、充实、焦虑）

关键词：
（列出 3 个关键词，用顿号分隔，例如：学习、音乐、编程）

要求：
1. 这是“今天整体”的总结，不是单条反馈
2. 保持自然，不像工作汇报
3. 不要胡乱推断没说过的事
4. 必须保留换行`,
          },
          {
            role: "user",
            content,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "今日整合总结生成失败。";

    return Response.json({ summary });
  } catch (error) {
    return Response.json({ error: "服务器出错了" }, { status: 500 });
  }
}