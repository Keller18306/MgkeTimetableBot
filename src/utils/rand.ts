import { randomInt } from 'crypto'

export function randArray<T>(values: T[]): T {
    const length = values.length

    const index = randomInt(length)

    return values[index]
}
