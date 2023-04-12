export class InputCancel extends Error {
    constructor() {
        super();

        this.name = 'InputCancel';
        this.message = 'Ввод был отменён';
    }
}

type ResolveValue = (string | undefined) | PromiseLike<string | undefined>;
type ResolveFunction = (value: ResolveValue) => void;
type CancelFunction = () => void;

export class BotInput {
    private promises: {
        [peerId: string]: {
            resolve: ResolveFunction,
            cancel: CancelFunction
        }
    } = {};

    public async create(peerId: string): Promise<string | undefined> {
        const that = this;

        const promise = new Promise<string | undefined>((resolve, reject) => {
            function cancel() {
                that.delete(peerId);
                reject(new InputCancel())
            }

            that.add(peerId, resolve, cancel)
        })

        return promise
    }

    private add(peerId: string, resolve: ResolveFunction, cancel: CancelFunction) {
        this.promises[peerId] = { resolve, cancel }
    }

    public resolve(peerId: string, text: ResolveValue) {
        this.promises[peerId].resolve(text);
        this.delete(peerId)
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