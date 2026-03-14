export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content = body.content;

    if (!content || !content.trim()) {
      return Response.json(
        { error: "内容不能为空" },
        { status: 400 }
      );
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
            content: `你是一个温和理性的周回顾助手。用户会给你过去一周的记录，请你输出一份自然清晰的周总结。

请严格按照下面格式输出：

本周总结：
用 4 到 6 句话总结这一周做了什么，重点关注学习、生活、创作、工作、情绪变化。

本周情绪：
用 1 到 3 个词概括这一周的整体状态。

本周关键词：
列出 3 到 5 个关键词，用顿号隔开。

下周建议：
给出 2 到 3 句轻量建议，语气自然，不要说教。

要求：
1. 不要编造用户没写过的内容。
2. 语言自然，不要太像工作汇报。
3. 重点从“人生记录”和“生活轨迹”角度总结，不只是情绪。`,
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

    const summary =
      data.choices?.[0]?.message?.content || "本周回顾生成失败。";

    return Response.json({ summary });
  } catch (error) {
    return Response.json(
      { error: "服务器出错了" },
      { status: 500 }
    );
  }
}