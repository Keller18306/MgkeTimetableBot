import { existsSync, readFileSync } from "fs"
import path from "path";

const filePath: string = path.join(__dirname, './../../subjects.csv');

function getSubjectsList(): any {
    if (!existsSync(filePath)) {
        return {};
    }

    const file = readFileSync(filePath, 'utf8')

    return Object.fromEntries(file.split('\n').map((line) => {
        line = line.trim();

        const parts = line.split(';', 2);

        return parts.reverse();
    }));
}

const subjects = getSubjectsList();

export function getFullSubjectName(subject: string): string {
    return subjects[subject] || subject;
}
