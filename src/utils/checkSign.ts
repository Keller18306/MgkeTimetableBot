import { createHmac } from 'crypto';
import * as qs from 'querystring';

function parseQuery(url: string) {
    return new URL(url).searchParams
}

export function checkSign(url: string, app: { id: number, secret: string }, validTime: number | false = 86400) {
    const urlParams = parseQuery(url)
    const ordered: {
        [key: string]: any
    } = {};

    let keys: string[] = []

    urlParams.forEach((value, key) => {
        if (!key.startsWith('vk_')) return;
        keys.push(key)
    })

    keys = keys.sort()

    for (const key of keys) ordered[key] = urlParams.get(key)

    if (ordered['vk_app_id'] != app.id) return false;
    if (validTime !== false && Math.floor(Date.now() / 1e3) - Number(ordered['vk_ts']) > validTime) return false;

    const stringParams = qs.stringify(ordered);
    const paramsHash = createHmac('sha256', app.secret)
        .update(stringParams)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return paramsHash === urlParams.get('sign');
}