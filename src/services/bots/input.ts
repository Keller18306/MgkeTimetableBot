export class InputCancel extends Error {
    constructor() {
        super();

        this.name = 'InputCancel';
        this.message = 'Ввод был отменён';
    }
}

export type InputInitiator = 'message' | 'command' | 'callback' | undefined;
export type InputResolvedValue = { text: string | undefined, initiator: InputInitiator } | undefined;
type ResolveFunction = (value: InputResolvedValue | PromiseLike<InputResolvedValue>) => void;
type CancelFunction = () => void;

export class BotInput {
    private promises: {
        [peerId: string]: {
            resolve: ResolveFunction,
            cancel: CancelFunction
        }
    } = {};

    public async create(peerId: string): Promise<InputResolvedValue> {
        if (this.has(peerId)) {
            // Если уже был какой-то "запрос на ввод", то отменяем его.
            this.cancel(peerId, true);
        }

        const promise = new Promise<InputResolvedValue>((resolve, reject) => {
            const cancel = () => {
                this.delete(peerId);
                reject(new InputCancel())
            }

            this.add(peerId, resolve, cancel)
        });

        return promise;
    }

    private add(peerId: string, resolve: ResolveFunction, cancel: CancelFunction) {
        this.promises[peerId] = { resolve, cancel }
    }

    public resolve(peerId: string, text?: string, initiator?: InputInitiator) {
        this.promises[peerId].resolve({ text, initiator });
        this.delete(peerId);
    }

    public cancel(peerId: string, reject: boolean = true) {
        if (!this.promises[peerId]) return;

        if (reject) {
            this.promises[peerId].cancel();
        }

        this.delete(peerId);
    }

    public has(peerId: string) {
        return Object.keys(this.promises).includes(peerId);
    }

    public delete(peerId: string) {
        delete this.promises[peerId];
    }
}