export function escapeRegex(string: string): string {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export type ParsedPayload = { action: string, data?: any };
export function parsePayload(data?: string): ParsedPayload | undefined {
    if (!data) { 
        return;
    }

    const parsed = data.match(/(.*?)(\[.*\]|\{.*\}|$)/);
    if (!parsed) {
        return;
    }

    return {
        action: parsed[1],
        data: parsed[2] ? JSON.parse(parsed[2]) : null
    }
}