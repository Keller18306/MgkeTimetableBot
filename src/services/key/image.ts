import { WriteBuffer } from '../../utils';
import { AbstractKey, KeyType } from './abstract';

export class ImageKey extends AbstractKey {
    protected keyType: KeyType = KeyType.Image;

    public getKey(image: string, ref: string, timestamp?: bigint | number): string {
        if (!timestamp) timestamp = Date.now();
        if (typeof timestamp === 'number') timestamp = BigInt(timestamp);

        let buffer_writer = new WriteBuffer();
        this.createKeyHeader(buffer_writer);

        const keyBuffer: Buffer = Buffer.from(image, 'base64url');

        buffer_writer.writeUInt16LE(keyBuffer.length);
        buffer_writer.writeBuffer(keyBuffer);
        buffer_writer.writeUInt16LE(ref.length);
        buffer_writer.writeString(ref);
        buffer_writer.writeBigUInt64LE(timestamp);

        return this.finallyEncrypt(buffer_writer);
    }

    public parseKey(encoded: string): { image: string, ref: string, timestamp: number } {
        const buffer = this.finallyDecrypt(encoded)
        this.keyHeader(buffer)

        return {
            image: buffer.readBuffer(buffer.readUInt16LE()).toString('base64url'),
            ref: buffer.readString(buffer.readUInt16LE()),
            timestamp: Number(buffer.readBigUInt64LE())
        }
    }

    public checkKey(image: string, sign: string): boolean {
        try {
            const parsed = this.parseKey(sign);

            return image === parsed.image;
        } catch (e) {
            return false;
        }
    }
}
