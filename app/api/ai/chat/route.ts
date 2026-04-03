import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.VOLCENGINE_API_KEY || 'empty-key',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

// Request timeout in ms
const REQUEST_TIMEOUT = 30000;

// Maximum prompt length to prevent token overflow (~8000 chars = ~2000 tokens buffer)
const MAX_PROMPT_LENGTH = 8000;

// Maximum conversation history messages to keep
const MAX_HISTORY_MESSAGES = 10;

// Default system prompt
const DEFAULT_SYSTEM_PROMPT = '你是一个低代码平台中的智能 AI 助手，精通前端开发，请使用中文回答问题，并尽可能提供对用户有帮助的页面结构构建或逻辑修改建议。';

// Truncate text with warning
function truncateWithWarning(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 50) + '...[内容已截断以避免超出长度限制]';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, systemPrompt, userMessage, messages: historyMessages } = body;

    // API Key missing - return 503 Service Unavailable
    if (!process.env.VOLCENGINE_API_KEY) {
      return NextResponse.json(
        { error: 'AI 服务未配置', message: '请在环境变量中配置 VOLCENGINE_API_KEY' },
        { status: 503 }
      );
    }

    // Validate model endpoint
    const modelEndpoint = process.env.VOLCENGINE_MODEL_ENDPOINT;
    if (!modelEndpoint) {
      return NextResponse.json(
        { error: 'AI 模型未配置', message: '请在环境变量中配置 VOLCENGINE_MODEL_ENDPOINT' },
        { status: 500 }
      );
    }

    // Build messages array with multi-turn context
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

    // System prompt
    const sysPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;
    messages.push({ role: 'system', content: sysPrompt });

    // Add conversation history (last N messages for context)
    if (historyMessages && Array.isArray(historyMessages)) {
      const recentHistory = historyMessages.slice(-MAX_HISTORY_MESSAGES);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'ai') {
          messages.push({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: typeof msg.content === 'string' ? msg.content : String(msg.content)
          });
        }
      }
    }

    // Current user message
    const currentUserMessage = (userMessage || prompt || '').trim();
    if (!currentUserMessage) {
      return NextResponse.json(
        { error: '请求内容为空', message: '请输入有效的消息内容' },
        { status: 400 }
      );
    }

    // Truncate prompt if too long
    const truncatedMessage = truncateWithWarning(currentUserMessage, MAX_PROMPT_LENGTH);
    messages.push({ role: 'user', content: truncatedMessage });

    // AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const completion = await openai.chat.completions.create({
        model: modelEndpoint,
        messages,
      }, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const result = completion.choices[0]?.message?.content || 'AI 没有返回响应';
      return NextResponse.json({
        result,
        // Return truncated length info if applicable
        truncated: currentUserMessage.length > MAX_PROMPT_LENGTH
      });
    } catch (abortError: any) {
      clearTimeout(timeoutId);
      if (abortError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'AI 请求超时', message: 'AI 响应时间过长，请重试' },
          { status: 504 }
        );
      }
      throw abortError;
    }
  } catch (error: any) {
    console.error('[AI Route] 请求火山引擎发生错误:', error?.message);
    // Return sanitized error - do not expose internal details
    return NextResponse.json(
      { error: 'AI 服务暂时不可用', message: '请稍后重试' },
      { status: 500 }
    );
  }
}
