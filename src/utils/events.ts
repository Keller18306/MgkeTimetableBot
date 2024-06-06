import { EventEmitter } from "events";

export const EventResolverSymbol = Symbol.for('EventResolver');

export class AsyncEventEmitter extends EventEmitter {
    private listenerMap = new WeakMap<
        (...args: any[]) => void,
        (...args: any[]) => void
    >();

    emitAsync(eventName: string | symbol, ...args: any[]): Promise<void> {
        return new Promise(async resolve => {
            if (!resolve.prototype) {
                resolve.prototype = {};
            }

            resolve.prototype.key = EventResolverSymbol;

            super.emit(eventName, ...args, resolve);
        });
    }

    on(eventName: string | symbol, listener: (...args: any[]) => void): this {
        const wrappedListener = async (...args: any[]) => {
            // check if event called from `awaitForEventDone` function
            if (args?.length) {
                const resolver = args[args.length - 1];
                if (
                    typeof resolver === 'function' &&
                    resolver.prototype?.key === EventResolverSymbol
                ) {
                    // try {
                    // } catch (e) { }

                    await listener(...args);
                    
                    return await resolver();
                }
            }
            return await listener(...args);
        };
        this.listenerMap.set(listener, wrappedListener);
        return super.on(eventName, wrappedListener);
    }

    once(eventName: string | symbol, listener: (...args: any[]) => void): this {
        const wrappedListener = async (...args: any[]) => {
            if (args?.length) {
                const resolver = args[args.length - 1];
                if (
                    typeof resolver === 'function' &&
                    resolver.prototype.key === EventResolverSymbol
                ) {
                    try {
                        await listener(...args);
                    } catch (e) { }
                    // remove listeners after the event is done
                    this.removeListener(eventName, listener);
                    this.removeListener(eventName, wrappedListener);
                    return await resolver();
                }
            }
            // remove listeners after the event is done
            this.removeListener(eventName, listener);
            this.removeListener(eventName, wrappedListener);
            return await listener(...args);
        };
        this.listenerMap.set(listener, wrappedListener);
        return super.once(eventName, wrappedListener);
    }

    removeListener(
        eventName: string | symbol,
        listener: (...args: any[]) => void,
    ): this {
        const wrappedListener = this.listenerMap.get(listener);
        if (wrappedListener) {
            this.listenerMap.delete(listener);
            return super.removeListener(eventName, wrappedListener);
        }

        return this;
    }

    off(
        eventName: string | symbol,
        listener: (...args: any[]) => void
    ): this {
        return this.removeListener(eventName, listener);
    }
}

export interface TypedEventEmitter<TEvents extends Record<string, any>> extends AsyncEventEmitter {
    emitAsync<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        ...eventArg: TEvents[TEventName]
    ): Promise<void>;

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

export class TypedEventEmitter<TEvents extends Record<string, any>> extends AsyncEventEmitter { }