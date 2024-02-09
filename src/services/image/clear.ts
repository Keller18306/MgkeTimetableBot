import { createHash } from "crypto";
import { existsSync } from "fs";
import { readdir, unlink } from "fs/promises";
import path from "path";
import { raspCache } from "../parser";
import { cachePath } from "./builder";

export async function clearOldImages(): Promise<void> {
    if (!existsSync(cachePath)) {
        return;
    }

    const timetables = [
        ...Object.values(raspCache.groups.timetable),
        ...Object.values(raspCache.teachers.timetable)
    ];

    const allowedFiles: string[] = timetables.map((timetable) => {
        return createHash('sha256').update(JSON.stringify(timetable)).digest('base64url') + '.png';
    });

    const currentFiles: string[] = await readdir(cachePath)

    for (const file of currentFiles) {
        if (allowedFiles.includes(file)) continue;

        //TODO CLEAR FROM UPLOAD CACHE
        await unlink(path.join(cachePath, file))
    }
}