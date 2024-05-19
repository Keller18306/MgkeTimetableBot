import { StorageModel } from "./model";

export class Storage {
    constructor(private storageName: string) { }

    public async get(key: string): Promise<string | null> {
        const entry = await StorageModel.findOne({
            where: { key },
            rejectOnEmpty: false
        });

        return entry?.value || null;
    }

    public async add(key: string, value: string, ttl: number = 0) {
        await StorageModel.upsert({
            storage: this.storageName,
            key, value,
            expiresAt: ttl ? new Date(Date.now() + (ttl * 1e3)) : null
        });
    }
}