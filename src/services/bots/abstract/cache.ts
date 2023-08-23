import { addValueIntoStorageByKey, getValueFromStorageByKey } from "../../../db";

export class FileCache {
    constructor(
        private storageName: string
    ) {}

    public get(key: string): string | null {
        const entry: any = getValueFromStorageByKey(this.storageName, key);

        return entry?.value || null;
    }

    public add(key: string, value: string) {
        addValueIntoStorageByKey(this.storageName, key, value, Math.floor(Date.now() / 1e3))
    }
}