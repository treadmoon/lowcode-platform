/**
 * Security utilities for AI chat endpoint
 * Prevents prompt injection, JSON injection, and other attacks
 */

// Patterns that indicate prompt injection attempts
const PROMPT_INJECTION_PATTERNS = [
    /ignore\s+(previous|all)\s+(instructions?|prompts?)/i,
    /disregard\s+(previous|all|your)\s+(instructions?|prompts?)/i,
    /forget\s+(previous|all)\s+(instructions?|prompts?)/i,
    /you\s+are\s+now\s+['""]?(not|something\s+else|free|unbound)/i,
    /pretend\s+you\s+(are|can|cannot)/i,
    /act\s+as\s+(if\s+you|though\s+you|自由|other)/i,
    /new\s+system\s+(prompt|instruction|message)/i,
    /override\s+(system|your)\s+(prompt|instructions?)/i,
    /ignore\s+instructions?\s*[:;]/i,
    /disregard\s+rules?\s*[:;]/i,
    /forget\s+rules?\s*[:;]/i,
    /\(system\)/i,
    /\[SYSTEM\]/i,
    /\{SYSTEM\}/i,
    /you\s+are\s+in\s+"?(developer|debug|super)/i,
    /roleplay\s+as\s+(?!.*低代码|.*助手)/i,
    /enclose\s+with\s+(system|instruction)/i,
    /\\u\s*00?/i,
    /\x00/i,
    /<script/i,
    /<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
];

// Patterns for detecting malicious JSON attempts
const JSON_INJECTION_PATTERNS = [
    /"\s*,\s*"?\w+"\s*:\s*{/,
    /}\s*,\s*{/,
    /undefined/i,
    /__proto__/i,
    /constructor/i,
    /prototype/i,
];

// Blocked content patterns (harmful content)
const HARMFUL_CONTENT_PATTERNS = [
    /api[_-]?key\s*=/i,
    /password\s*[:=]/i,
    /secret\s*[:=]/i,
    /token\s*[:=]/i,
    /sk[-_]/i,
    /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/i,
    /-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----/i,
];

// Maximum sizes
const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_TOTAL_LENGTH = 20000;
const MAX_COMPONENT_DEPTH = 10;
const MAX_STRING_LENGTH = 10000;

/**
 * Check if content contains prompt injection patterns
 */
export function containsPromptInjection(content: string): boolean {
    return PROMPT_INJECTION_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Check if content contains JSON injection patterns
 */
export function containsJSONInjection(content: string): boolean {
    return JSON_INJECTION_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Check if content contains harmful patterns
 */
export function containsHarmfulContent(content: string): boolean {
    return HARMFUL_CONTENT_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Sanitize user input to prevent injection
 */
export function sanitizeUserInput(input: string): string {
    if (!input) return '';

    let sanitized = input;

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Remove script tags and event handlers (XSS prevention)
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/\bon\w+\s*=/gi, 'on_=');

    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript\s*:/gi, '');

    // Remove data: URLs that could be used for XSS
    sanitized = sanitized.replace(/data\s*:\s*[^,;]*/gi, '');

    // Trim and limit length
    sanitized = sanitized.trim();
    if (sanitized.length > MAX_MESSAGE_LENGTH) {
        sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH);
    }

    return sanitized;
}

/**
 * Validate history messages for security issues
 */
export interface HistoryMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
    sanitized?: HistoryMessage[];
}

export function validateHistoryMessages(messages: unknown[]): ValidationResult {
    if (!Array.isArray(messages)) {
        return { valid: false, error: '历史消息必须是数组' };
    }

    if (messages.length > 20) {
        return { valid: false, error: '历史消息数量超出限制' };
    }

    let totalLength = 0;
    const sanitized: HistoryMessage[] = [];

    for (const msg of messages) {
        if (!msg || typeof msg !== 'object') {
            continue;
        }

        const m = msg as Record<string, unknown>;

        // Validate role
        const role = m.role as string;
        if (role !== 'user' && role !== 'ai' && role !== 'assistant') {
            continue;
        }

        // Validate content
        let content: string = m.content as string;
        if (typeof content === 'object' && content !== null) {
            content = JSON.stringify(content);
        }
        if (typeof content !== 'string') {
            content = String(content);
        }

        // Sanitize content
        content = sanitizeUserInput(content);
        if (content.length > MAX_STRING_LENGTH) {
            content = content.substring(0, MAX_STRING_LENGTH);
        }

        totalLength += content.length;
        if (totalLength > MAX_HISTORY_TOTAL_LENGTH) {
            break;
        }

        // Check for injection in history
        if (containsPromptInjection(content)) {
            continue; // Skip messages with injection patterns
        }

        sanitized.push({
            role: role === 'ai' ? 'assistant' : 'user',
            content
        });
    }

    return { valid: true, sanitized };
}

/**
 * Validate component schema recursively
 */
export function validateComponentSchema(comp: unknown, depth = 0): boolean {
    if (depth > MAX_COMPONENT_DEPTH) return false;
    if (!comp || typeof comp !== 'object') return false;

    const c = comp as Record<string, unknown>;

    // Check required fields
    if (typeof c.id !== 'string' || !c.id) return false;
    if (typeof c.type !== 'string' || !c.type) return false;

    // Validate type is one of allowed types
    const validTypes = new Set([
        'Text', 'Button', 'Input', 'Container', 'Image',
        'Card', 'Divider', 'Checkbox', 'Switch', 'CustomComponent'
    ]);
    if (!validTypes.has(c.type as string)) return false;

    // Validate props is object
    if (c.props !== undefined && (typeof c.props !== 'object' || c.props === null)) {
        return false;
    }

    // Validate children recursively
    if (c.children !== undefined) {
        if (!Array.isArray(c.children)) return false;
        for (const child of c.children) {
            if (!validateComponentSchema(child, depth + 1)) return false;
        }
    }

    return true;
}

/**
 * Sanitize AI response output
 */
export function sanitizeAIOutput(output: string): string {
    if (!output) return '';

    let sanitized = output;

    // Remove any embedded null bytes
    sanitized = sanitized.replace(/\x00/g, '');

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Ensure no script injection in output
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/\son\w+\s*=/gi, 'on_=');

    // Limit length
    if (sanitized.length > 50000) {
        sanitized = sanitized.substring(0, 50000) + '...[输出已截断]';
    }

    return sanitized;
}

/**
 * Get security headers for response
 */
export function getSecurityHeaders(): Record<string, string> {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-RateLimit-Remaining': '20',
        'Cache-Control': 'no-store',
    };
}
