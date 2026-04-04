import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  sanitizeUserInput,
  validateHistoryMessages,
  containsPromptInjection,
  sanitizeAIOutput,
  getSecurityHeaders
} from '../security';

const openai = new OpenAI({
  apiKey: process.env.VOLCENGINE_API_KEY || 'empty-key',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

// Request timeout in ms
const REQUEST_TIMEOUT = 30000;

// Maximum prompt length to prevent token overflow
const MAX_PROMPT_LENGTH = 8000;

// Rate limiting: in-memory counter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute window
const RATE_LIMIT_MAX = 20; // max 20 requests per window

// Default system prompt - NEVER trust client-provided system prompts
const DEFAULT_SYSTEM_PROMPT = `你是一个低代码平台中的智能 AI 助手，精通前端开发，请使用中文回答问题，并尽可能提供对用户有帮助的页面结构构建或逻辑修改建议。

你必须严格遵循以下 JSON 输出格式，不要添加任何 Markdown 代码块标记。

【重要】只使用以下组件类型：Text, Button, Input, Image, Container, Card, Divider, Checkbox, Switch, CustomComponent

【示例 1 - 生成页面布局】
[{"id":"comp-001","type":"Container","props":{"className":"p-6 bg-slate-50 min-h-screen"},"children":[{"id":"comp-002","type":"Text","props":{"className":"text-2xl font-bold text-slate-900","content":"标题文本"}}]}]

【示例 2 - 创建可复用组件】
{"intent":"create_reusable","name":"组件名称","component":{"id":"comp-001","type":"Container","props":{"className":"flex gap-4"},"children":[]}}`;

// Check rate limit
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW;
    rateLimitMap.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt };
}

// Truncate text with warning
function truncateWithWarning(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 50) + '...[内容已截断以避免超出长度限制]';
}

export async function POST(req: Request) {
  // Default security headers (will be updated with rate limit info after check)
  const defaultSecurityHeaders = getSecurityHeaders();

  try {
    // Rate limit check
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(ip);
    const securityHeaders = {
      ...defaultSecurityHeaders,
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    };

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '请求过于频繁', message: '请稍后再试', retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000) },
        { status: 429, headers: { ...securityHeaders, 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Parse body with size limit
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: '无效的请求格式', message: '请求体必须是有效的 JSON' },
        { status: 400, headers: securityHeaders }
      );
    }

    const { prompt, systemPrompt, userMessage, messages: historyMessages, stream } = body;

    // API Key missing - return 503 Service Unavailable
    if (!process.env.VOLCENGINE_API_KEY) {
      return NextResponse.json(
        { error: 'AI 服务未配置', message: '请在环境变量中配置 VOLCENGINE_API_KEY' },
        { status: 503, headers: securityHeaders }
      );
    }

    // Validate model endpoint
    const modelEndpoint = process.env.VOLCENGINE_MODEL_ENDPOINT;
    if (!modelEndpoint) {
      return NextResponse.json(
        { error: 'AI 模型未配置', message: '请在环境变量中配置 VOLCENGINE_MODEL_ENDPOINT' },
        { status: 500, headers: securityHeaders }
      );
    }

    // Build messages array with multi-turn context
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

    // ALWAYS use default system prompt - ignore any client-provided one for security
    messages.push({ role: 'system', content: DEFAULT_SYSTEM_PROMPT });

    // Validate and sanitize history messages
    if (historyMessages && Array.isArray(historyMessages)) {
      const historyValidation = validateHistoryMessages(historyMessages);
      if (!historyValidation.valid) {
        return NextResponse.json(
          { error: '历史消息无效', message: historyValidation.error },
          { status: 400, headers: securityHeaders }
        );
      }
      if (historyValidation.sanitized) {
        messages.push(...historyValidation.sanitized);
      }
    }

    // Current user message - sanitize input
    const rawUserMessage = userMessage || prompt || '';
    const currentUserMessage = sanitizeUserInput(rawUserMessage);

    if (!currentUserMessage) {
      return NextResponse.json(
        { error: '请求内容为空', message: '请输入有效的消息内容' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Check for prompt injection in user message
    if (containsPromptInjection(currentUserMessage)) {
      console.warn('[Security] Prompt injection detected from IP:', ip);
      return NextResponse.json(
        { error: '请求内容包含无效字符', message: '请输入正常的请求内容' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Truncate prompt if too long
    const truncatedMessage = truncateWithWarning(currentUserMessage, MAX_PROMPT_LENGTH);
    messages.push({ role: 'user', content: truncatedMessage });

    // AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      // Streaming mode
      if (stream === true) {
        const openaiStream = await openai.chat.completions.create({
          model: modelEndpoint,
          messages,
          stream: true,
        }, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // Create SSE stream with sanitized output
        const encoder = new TextEncoder();
        const streamResp = new ReadableStream({
          async start(sseController) {
            try {
              for await (const chunk of openaiStream) {
                let content = chunk.choices[0]?.delta?.content || '';
                // Sanitize output
                content = sanitizeAIOutput(content);
                if (content) {
                  try {
                    sseController.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  } catch {
                    // Skip malformed content
                  }
                }
              }
              sseController.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
              sseController.close();
            } catch (e) {
              sseController.error(e);
            }
          }
        });

        return new Response(streamResp, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        });
      }

      // Non-streaming mode (fallback)
      const completion = await openai.chat.completions.create({
        model: modelEndpoint,
        messages,
      }, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let result = completion.choices[0]?.message?.content || 'AI 没有返回响应';
      // Sanitize output
      result = sanitizeAIOutput(result);

      return NextResponse.json({
        result,
        truncated: currentUserMessage.length > MAX_PROMPT_LENGTH
      }, {
        headers: securityHeaders
      });
    } catch (abortError: any) {
      clearTimeout(timeoutId);
      if (abortError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'AI 请求超时', message: 'AI 响应时间过长，请重试' },
          { status: 504, headers: securityHeaders }
        );
      }
      throw abortError;
    }
  } catch (error: any) {
    console.error('[AI Route] 请求火山引擎发生错误:', error?.message);
    // Return sanitized error - do not expose internal details
    return NextResponse.json(
      { error: 'AI 服务暂时不可用', message: '请稍后重试' },
      { status: 500, headers: defaultSecurityHeaders }
    );
  }
}
