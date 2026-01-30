export async function mockAIRequest(prompt: string): Promise<{ result: string }> {
    console.log(`[AI Mock] Received prompt: ${prompt}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simple mock responses
    if (prompt.toLowerCase().includes('hello')) {
        return { result: "Hello there! I am your AI assistant (Mock)." };
    }

    return { result: `AI Analysis Complete: Processed "${prompt}" and found it interesting.` };
}
