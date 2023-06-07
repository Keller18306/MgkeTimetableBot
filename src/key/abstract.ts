import { createCipheriv, createDecipheriv, createHmac, createSecretKey, randomBytes } from 'crypto';
import { ReadBuffer, WriteBuffer } from '../utils';

export enum KeyType {
    Request,
    Accept,
    Api,
    Image
}

export type KeyHeader = {
    type: KeyType
}

export abstract class AbstractKey {
    private key: Buffer;

    private encryptKeyLength: number = 32
    private encryptMethod: string = 'aes-256-cbc';

    private hmacLength: number = 20
    private hmacMethod: string = 'sha1'

    protected abstract keyType: KeyType;

    protected _iv?: Buffer;

    constructor(key: Buffer) {
        this.key = key
    }

    protected keyHeader(buffer: ReadBuffer): KeyHeader {
        const bits = buffer.readBuffer(1).readUInt8().toString(2).padStart(8, '0')

        const keyType: KeyType = parseInt(bits.slice(0, 2), 2)

        if (keyType != this.keyType) throw new Error('key type error')

        return {
            type: keyType
        }
    }

    protected createKeyHeader(buffer: WriteBuffer) {
        buffer.writeBuffer(this.packBits(
            this.keyType.toString(2).padStart(2, '0') +
            '000000' //reserved
        ))
    }

    abstract getKey(...params: any[]): any
    abstract parseKey(...params: any[]): any

    // private decodeZeroBytes(buffer: Buffer): Buffer {
    //     let countZero: number = 0;
    //     let countNewZero: number = 0;

    //     let isNextCount: boolean = false;
    //     for (const byte of buffer) {
    //         if (isNextCount) {
    //             isNextCount = false
    //             countNewZero += byte;
    //             countZero++
    //             continue;
    //         }

    //         if (byte !== 0) continue;

    //         countZero++
    //         isNextCount = true
    //     }

    //     const newBuffer: Buffer = Buffer.alloc(buffer.length - countZero + countNewZero)

    //     let offset: number = 0

    //     const bytes: number[] = Array.from(buffer);
    //     let nextSkip: boolean = false;
    //     for (const i in bytes) {
    //         if (nextSkip) {
    //             nextSkip = false;
    //             continue;
    //         }

    //         const byte = bytes[i];

    //         if (byte === 0) {
    //             const count = bytes[+i + 1]
    //             nextSkip = true

    //             for (let i = 0; i < count; i++) {
    //                 newBuffer.writeInt8(0, offset)
    //                 offset++
    //             }

    //             continue;
    //         }

    //         newBuffer.writeUInt8(byte, offset)

    //         offset++;
    //     }

    //     return newBuffer
    // }

    // private encodeZeroBytes(buffer: Buffer): Buffer {
    //     let countZero: number = 0;
    //     let zeroParts: number = 0;

    //     let isLastZero: boolean = false;
    //     for (const byte of buffer) {
    //         if (byte !== 0) {
    //             if (isLastZero) {
    //                 isLastZero = false
    //                 zeroParts++
    //             }
    //             continue;
    //         }

    //         countZero++
    //         isLastZero = true
    //     }

    //     const newBuffer: Buffer = Buffer.alloc(buffer.length - countZero + zeroParts * 2)

    //     let offset: number = 0

    //     const bytes: number[] = Array.from(buffer);
    //     let currentZeroCount: number = 0;
    //     for (const i in bytes) {
    //         const byte = bytes[i];

    //         if (byte !== 0) {
    //             newBuffer.writeUInt8(byte, offset)

    //             offset++;

    //             continue;
    //         }

    //         currentZeroCount++

    //         if (bytes[+i + 1] && bytes[+i + 1] === 0) continue;

    //         newBuffer.writeInt8(0, offset)
    //         offset++
    //         if (currentZeroCount > 1) {
    //             newBuffer.writeUInt8(currentZeroCount, offset)
    //             offset++
    //         }
    //         currentZeroCount = 0
    //     }

    //     return newBuffer;
    // }

    protected packBits(bits: string): Buffer {
        bits = bits.replace(/\s/g, '')

        if (bits.length > 8) throw new Error('incorrect bits')

        const number = parseInt(bits, 2)

        const buffer: Buffer = Buffer.alloc(1)
        buffer.writeUInt8(number)

        return buffer
    }

    protected packNumberU64LE(number: number | bigint): Buffer {
        if (typeof number === 'number') number = BigInt(number)

        const buffer: Buffer = Buffer.alloc(8)
        buffer.writeBigUInt64LE(number)

        return buffer
    }

    private encrypt(data: Buffer, _iv?: Buffer): [Buffer, Buffer] {
        const iv = _iv || randomBytes(16)
        const cipherKey = createSecretKey(this.key.slice(0, this.encryptKeyLength))

        const cipher = createCipheriv(this.encryptMethod, cipherKey, iv)

        const encrypted = Buffer.concat([cipher.update(data), cipher.final()])

        return [
            iv,
            encrypted
        ]
    }

    protected finallyEncrypt(buffer: WriteBuffer | Buffer, _iv?: Buffer): string {
        if (buffer instanceof WriteBuffer) buffer = buffer.toBuffer()
        
        //buffer = this.encodeZeroBytes(buffer)

        const [iv, encrypted] = this.encrypt(buffer, _iv)
        buffer = Buffer.concat([iv, encrypted])

        const hash = this.hmac(buffer)
        buffer = Buffer.concat([hash, buffer])

        return buffer.toString('base64url')
    }

    private decrypt(data: Buffer, iv: Buffer): Buffer {
        const cipherKey = createSecretKey(this.key.slice(0, this.encryptKeyLength))

        const cipher = createDecipheriv(this.encryptMethod, cipherKey, iv)

        const decrypted = Buffer.concat([cipher.update(data), cipher.final()])

        return decrypted
    }

    protected finallyDecrypt(encoded: string): ReadBuffer {
        const buffer_reader_public = new ReadBuffer(Buffer.from(encoded, 'base64url'))

        const [got_hash, iv, encrypted] = [
            buffer_reader_public.readBuffer(this.hmacLength),
            buffer_reader_public.readBuffer(16),
            buffer_reader_public.readPadding()
        ]
        this._iv = iv
        const calc_hash = this.hmac(Buffer.concat([iv, encrypted]))

        if (Buffer.compare(calc_hash, got_hash) !== 0) throw new Error('invalid data')

        let data = this.decrypt(encrypted, iv)
        //data = this.decodeZeroBytes(data)

        return new ReadBuffer(data)
    }

    private hmac(data: Buffer) {
        return createHmac(this.hmacMethod, this.key).update(data).digest()
    }
}

