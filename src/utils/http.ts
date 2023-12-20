import { Request } from "express";

export function getParams(request: Request) {
    return {
        ...request.query,  // параметры строки запроса
        ...request.body   // параметры тела запроса (POST)
        // ...request.params  // параметры пути
    };
}

export function getIp(req: Request) {
    return req.header('X-Forwarded-For')?.split(', ')[0] ?? req.ip
}

export function replaceWithValueLength(obj: any) {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => {
            if ((Array.isArray(value) || typeof value === 'string') && value.length > 32) {
                return [key, value.length];
            } else {
                return [key, value];
            }
        })
    );
}