export function prepareError(error: Error): string | undefined {
    return error.stack?.replaceAll(process.cwd(), '');
}