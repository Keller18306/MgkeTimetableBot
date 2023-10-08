export function escapeRegex(string: string): string {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function parsePayload(data?: string): { action: string, data?: any } | false {
    if (!data) { 
        return false;
    }

    const parsed = data.match(/(.*?)(\[.*\]|\{.*\}|$)/);
    if (!parsed) {
        return false;
    }

    return {
        action: parsed[1],
        data: parsed[2] ? JSON.parse(parsed[2]) : null
    }
}