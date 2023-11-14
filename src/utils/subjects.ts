import { existsSync, readFileSync } from "fs";
import path from "path";

const filePath: string = path.join(__dirname, './../../subjects.csv');


type Subjects = {
    subjectsByShort: {
        [key: string]: string
    },
    subjectsByFull: {
        [key: string]: string
    }
}
function getSubjectsList(): Subjects {
    if (!existsSync(filePath)) {
        return {
            subjectsByShort: {},
            subjectsByFull: {}
        };
    }

    const file = readFileSync(filePath, 'utf8');

    const byShort = Object.fromEntries(file.split('\n').map((line) => {
        line = line.trim();

        const parts = line.split(';', 2);

        return parts.reverse();
    }));

    const byFull = Object.fromEntries(file.split('\n').map((line) => {
        line = line.trim();

        const parts = line.split(';', 2);

        return parts;
    }));

    return {
        subjectsByShort: byShort,
        subjectsByFull: byFull
    }
}

const { subjectsByFull, subjectsByShort } = getSubjectsList();

export function getFullSubjectName(subject: string): string {
    return subjectsByShort[subject] || subject;
}

export function getShortSubjectName(subject: string): string {
    return subjectsByFull[subject] || subject;
}
