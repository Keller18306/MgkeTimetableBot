export function arrayUnique<T>(array: T[]): T[] {
    const newArray: T[] = []

    for (const value of array) {
        if (newArray.includes(value)) continue;

        newArray.push(value)
    }

    return newArray;
}