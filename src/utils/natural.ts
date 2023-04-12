import { JaroWinklerDistance } from "natural";

export function closestJaroWinkler(str: string, array: string[], minScore: number = 0): { value: string, score: number } | undefined {
    if (array.includes(str)) {
        return { value: str, score: 1 }
    }

    const teacher = array.sort((a, b) =>
        JaroWinklerDistance(str, b, { ignoreCase: true }) - JaroWinklerDistance(str, a, { ignoreCase: true })
    )[0];
    const score = JaroWinklerDistance(str, teacher, { ignoreCase: true });

    if (score < minScore) {
        return undefined;
    }

    return {
        value: teacher,
        score: score
    }
}