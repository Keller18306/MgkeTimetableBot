export function addslashes(string: string | number): string {
    if (typeof string === 'number') {
        if (isNaN(string)) {
            throw new Error('NaN cannot be used');
        }

        return String(string);
    }

    return string.replace(/\\/g, '\\\\').
        replace(/\u0008/g, '\\b').
        replace(/\t/g, '\\t').
        replace(/\n/g, '\\n').
        replace(/\f/g, '\\f').
        replace(/\r/g, '\\r').
        replace(/'/g, '\\\'').
        replace(/"/g, '\\"').
        replace(/`/g, '\\`');
}