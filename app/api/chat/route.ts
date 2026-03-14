export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages;

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "消息格式不正确" },
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
            content: "你是一个温和自然的聊天助手，只用1到3句话回应用户。",
          },
          ...messages,
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content ||
      "我刚刚有点卡住了，你再说一句试试。";

    return Response.json({ reply });
  } catch (error) {
    return Response.json(
      { error: "服务器出错了" },
      { status: 500 }
    );
  }
}