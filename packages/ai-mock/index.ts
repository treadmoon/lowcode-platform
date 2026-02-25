export async function mockAIRequest(prompt: string): Promise<{ result: string }> {
    console.log(`[AI 引擎] 正在向 API 发送提示词: ${prompt}`);

    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            throw new Error(`API 请求错误: ${response.status}`);
        }

        const data = await response.json();
        return { result: data.result || JSON.stringify(data) };
    } catch (error: any) {
        console.error(`[AI 引擎] 请求失败:`, error);
        return { result: `AI 服务发生错误. (${error?.message ?? '未知错误'})` };
    }
}
