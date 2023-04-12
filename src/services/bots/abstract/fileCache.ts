import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export class FileCache {
    private cachePath: string;
    private cache: { [id: string]: string } = {}
    private cacheLoaded: boolean = false;

    constructor(fileName: string) {
        const folder: string = this.createFolder()

        this.cachePath = path.join(folder, fileName);
    }

    public get(file: string): string | null {
        this.loadFile()

        return this.cache[file] || null;
    }

    public add(file: string, result: string) {
        this.cache[file] = result;

        this.saveFile()
    }

    private createFolder(): string {
        const folder: string = path.join(__dirname, './../../../../cache/files');
        if (!existsSync(folder)) {
            mkdirSync(folder, { recursive: true });
        }

        return folder;
    }

    private loadFile() {
        if (this.cacheLoaded) return;

        if (existsSync(this.cachePath)) {
            this.cache = JSON.parse(readFileSync(this.cachePath, 'utf8'))
        }

        this.cacheLoaded = true;
    }

    private saveFile() {
        this.createFolder();

        writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 4));
    }
}