import { randomBytes } from 'crypto';
import { WriteBuffer } from '../utils';
import { AbstractKey, KeyType } from './abstract';

export enum FromType {
    VKBot,
    VKApp,
    TelegramBot,
    ViberBot,
    AndroidApp
}

export const appType = [
    'VK Bot',
    'VK App',
    'Telegram Bot',
    'Viber Bot',
    'Android App'
]

export type InputRequestKey = {
    from: FromType.VKBot,
    peer_id: number,
    sender_id: number,
    time: number | bigint
} | {
    from: FromType.VKApp,
    user_id: number,
    time: number | bigint
} | {
    from: FromType.TelegramBot,
    peer_id: number,
    sender_id: number,
    time: number | bigint
} | {
    from: FromType.ViberBot
    user_id: string,
    time: number | bigint
}

export class RequestKey extends AbstractKey {
    private v: number = 2;
    protected keyType: KeyType = KeyType.Request;

    public getKey(input: InputRequestKey) {
        let buffer_writer = new WriteBuffer()
        this.createKeyHeader(buffer_writer)

        buffer_writer.writeBuffer(this.packBits(
            this.v.toString(2).padStart(4, '0') +
            input.from.toString(2).padStart(4, '0')
        ))

        switch (input.from) {
            case FromType.VKBot: {
                const isIdEqu = (input.peer_id == input.sender_id)

                buffer_writer.writeBuffer(this.packBits(
                    String(+isIdEqu) +
                    '0000000' // reserved
                ))
                buffer_writer.writeBuffer(this.packNumberU64LE(input.time))
                buffer_writer.writeInt32BE(input.peer_id)
                if (!isIdEqu) buffer_writer.writeInt32BE(input.sender_id)

                break;
            }
            case FromType.VKApp: {
                buffer_writer.writeBuffer(this.packNumberU64LE(input.time))
                buffer_writer.writeInt32BE(input.user_id)
                break;
            }

            case FromType.ViberBot: {
                buffer_writer.writeBuffer(this.packNumberU64LE(input.time))

                const user_id = Buffer.from(input.user_id, 'base64')
                if (user_id.length != 16) throw new Error('error viber id length')
                buffer_writer.writeBuffer(user_id)
                break;
            }
        }

        buffer_writer.writeBuffer(randomBytes(1))

        return this.finallyEncrypt(buffer_writer)
    }

    public parseKey(encoded: string): InputRequestKey & { payload: number } {
        const buffer = this.finallyDecrypt(encoded)
        this.keyHeader(buffer)

        const bits = buffer.readBuffer(1).readUInt8().toString(2).padStart(8, '0')

        const _v = parseInt(bits.slice(0, 4), 2)
        if (_v != this.v) {
            if (_v < this.v) throw new Error('old key version')
            throw new Error('incorrect key version')
        }

        const payload = buffer.readIntBE(buffer.buffer.length - 1, 1)

        const from: FromType = parseInt(bits.slice(4, 8), 2)

        switch (from) {
            case FromType.VKBot: {
                const bot_bits = buffer.readBuffer(1).readUInt8().toString(2).padStart(8, '0')
                const isIdEqu = Boolean(+bot_bits[0])

                const time = buffer.readBigUInt64LE()
                const peer_id = buffer.readInt32BE()
                const sender_id = !isIdEqu ? buffer.readInt32BE() : peer_id

                return {
                    from: FromType.VKBot,
                    sender_id,
                    peer_id,
                    time,
                    payload
                }
            }

            case FromType.VKApp: {
                const time = buffer.readBigUInt64LE()
                const user_id = buffer.readInt32BE()

                return {
                    from: FromType.VKApp,
                    user_id,
                    time,
                    payload
                }
            }

            case FromType.ViberBot: {
                const time = buffer.readBigUInt64LE()
                const user_id = buffer.readBuffer(16).toString('base64')

                return {
                    from: FromType.ViberBot,
                    user_id,
                    time,
                    payload
                }
            }
        }

        throw new Error('unknown app in key')
    }
}
