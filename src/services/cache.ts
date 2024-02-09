import { addValueIntoStorageByKey, getValueFromStorageByKey, updateMetaStorageByKey } from "../db";

export class ServiceCache {
    constructor(private storageName: string) { }

    public get(key: string): string | null {
        const entry: any = getValueFromStorageByKey(this.storageName, key);

        return entry?.value || null;
    }

    public add(key: string, value: string) {
        addValueIntoStorageByKey(this.storageName, key, value, Math.floor(Date.now() / 1e3))
    }

    public getMeta(key: string, metaKey: string): any {
        const entry: any = getValueFromStorageByKey(this.storageName, key);
        if (!entry) {
            throw new Error('calendar not exists in cache');
        }

        const store = entry.meta ? JSON.parse(entry.meta) : {}

        return store[metaKey];
    }

    public setMeta(key: string, metaKey: string, metaValue: string | number) {
        const entry: any = getValueFromStorageByKey(this.storageName, key);
        if (!entry) {
            throw new Error('calendar not exists in cache');
        }

        const store = entry.meta ? JSON.parse(entry.meta) : {}

        store[metaKey] = metaValue;

        updateMetaStorageByKey(this.storageName, key, JSON.stringify(store));
    }
}