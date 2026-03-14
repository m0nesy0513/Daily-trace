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
            content: `你是一个温和、敏锐、克制的记录助手。

你的任务是：只根据“用户刚刚写下的这一条内容”，生成一段简洁自然的反馈总结。

要求：
1. 只总结这一条，不要总结今天全部
2. 语气像被温和接住，不要像报告
3. 控制在 2 到 4 句话
4. 不要使用“标题：”“情绪：”这类结构化字段
5. 不要长篇大论
6. 不要胡乱推断用户没说的事`,
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
    const summary = data.choices?.[0]?.message?.content || "本条总结生成失败。";

    return Response.json({ summary });
  } catch (error) {
    return Response.json({ error: "服务器出错了" }, { status: 500 });
  }
}