import { randomBytes } from 'crypto';
import { WriteBuffer } from '../../utils';
import { AbstractKey, KeyType } from './abstract';

export class ApiKey extends AbstractKey {
    protected keyType: KeyType = KeyType.Api;

    public getKey(id: bigint | number, iv: Buffer | string): string {
        if (typeof id === 'number') id = BigInt(id);
        if (typeof iv === 'string') iv = Buffer.from(iv, 'base64url');

        let buffer_writer = new WriteBuffer();
        this.createKeyHeader(buffer_writer);

        buffer_writer.writeBigUInt64BE(id);

        return this.finallyEncrypt(buffer_writer, iv);
    }

    public parseKey(encoded: string): { id: bigint, iv: string } {
        const buffer = this.finallyDecrypt(encoded);
        this.keyHeader(buffer);

        return {
            id: buffer.readBigUInt64BE(),
            iv: this._iv!.toString('base64url')
        }
    }

    public createKey(id: bigint | number) {
        if (typeof id === 'number') id = BigInt(id);

        const iv = randomBytes(16);
        const key = this.getKey(id, iv);

        return {
            key: key,
            iv: iv.toString('base64url')
        }
    }

    public createStringIV(): string {
        return randomBytes(16).toString('base64url');
    }
}
