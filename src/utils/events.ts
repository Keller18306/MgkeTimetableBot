import { EventEmitter } from "events";

export interface TypedEventEmitter<TEvents extends Record<string, any>> extends EventEmitter {
    emit<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        ...eventArg: TEvents[TEventName]
    ): boolean;

    on<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        handler: (...eventArg: TEvents[TEventName]) => void
    ): this;

    once<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        handler: (...eventArg: TEvents[TEventName]) => void
    ): this;

    off<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        handler: (...eventArg: TEvents[TEventName]) => void
    ): this;
}

export class TypedEventEmitter<TEvents extends Record<string, any>> extends EventEmitter {}