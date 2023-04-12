export function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let chunkId: number = 0; chunkId < Math.ceil(array.length / size); chunkId++) {
        const chunk: any[] = [];

        for (let item: number = 0; item < size; item++) {
            const i: number = chunkId * size + item;
            chunk.push(array[i])
        }

        chunks.push(chunk);
    }

    return chunks;
} 