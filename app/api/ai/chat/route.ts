import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.VOLCENGINE_API_KEY || 'empty-key',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

// Using edge runtime can be faster for AI if supported, but let's stick to nodejs first
// export const runtime = 'edge'; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt;

    if (!process.env.VOLCENGINE_API_KEY) {
      console.warn("[API Key 缺失] 无法请求火山引擎大模型，返回模拟数据以避免崩溃。");
      return NextResponse.json(
        { result: `[温馨提示: 您还没有配置 VOLCENGINE_API_KEY] AI 已收到请求： "${prompt}"` },
        { status: 200 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: process.env.VOLCENGINE_MODEL_ENDPOINT || '', // usually looks like 'ep-...'
      messages: [
        { role: 'system', content: '你是一个低代码平台中的智能 AI 助手，精通前端开发，请使用中文回答问题，并尽可能提供对用户有帮助的页面结构构建或逻辑修改建议。' },
        { role: 'user', content: prompt }
      ],
    });

    const result = completion.choices[0]?.message?.content || 'AI 没有返回响应';

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('[AI Route] 请求火山引擎发生错误:', error);
    return NextResponse.json(
      { error: '请求 AI 服务失败', details: error.message },
      { status: 500 }
    );
  }
}
