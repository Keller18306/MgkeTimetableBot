import { decode, encode } from 'cbor-x';
import { createHmac, timingSafeEqual } from 'crypto';
import { config } from '../../config';

function hmac(data: Buffer): Buffer {
    return createHmac('sha256', config.encrypt_key).update(data).digest();
}

export function serialize(data: any): string {
    const buffer = encode(data);
    const hash = hmac(buffer);

    return buffer.toString('base64url') + '.' + hash.toString('base64url');
}

export function unserialize(data: string): any {
    const [buffer, hash] = data.split('.', 2).map((data) => {
        return Buffer.from(data, 'base64url');
    });

    if (!buffer || !hash || !timingSafeEqual(hmac(buffer), hash)) {
        throw new Error('Invalid data');
    }

    return decode(buffer);    
}
