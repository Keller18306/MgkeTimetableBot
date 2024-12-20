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

interface InputPromiseElement {
    answer: ResolveFunction;
    cancel: CancelFunction;
    timeout: NodeJS.Timeout;
}

export class BotInput {
    private promises: {
        [peerId: string]: InputPromiseElement
    } = {};

    constructor(
        private readonly msTimeout: number = 10 * 60 * 1e3 // 10min
    ) { }

    public async create(peerId: string): Promise<InputResolvedValue> {
        if (this.has(peerId)) {
            // Если уже был какой-то "запрос на ввод", то отменяем его.
            this.cancel(peerId);
        }

        const promise = new Promise<InputResolvedValue>((resolve, reject) => {
            const element: Partial<InputPromiseElement> = {};

            element.answer = (value: InputResolvedValue | PromiseLike<InputResolvedValue>) => {
                this.delete(peerId);

                clearTimeout(element.timeout);
                resolve(value);
            }

            element.cancel = () => {
                this.delete(peerId);

                clearTimeout(element.timeout);
                reject(new InputCancel());
            }

            element.timeout = setTimeout(() => {
                if (!element.cancel) {
                    throw new Error('Cancel function not available');
                }

                element.cancel();
            }, this.msTimeout)

            this.add(peerId, element as InputPromiseElement);
        });

        return promise;
    }

    public resolve(peerId: string, text?: string, initiator?: InputInitiator) {
        if (!this.has(peerId)) return;

        this.promises[peerId].answer({ text, initiator });
    }

    public cancel(peerId: string) {
        if (!this.has(peerId)) return;

        this.promises[peerId].cancel();
    }

    public has(peerId: string) {
        return this.promises[peerId] !== undefined;
    }

    private add(peerId: string, element: InputPromiseElement) {
        if (this.has(peerId)) {
            throw new Error('Uncompleted promise already exists')
        }

        this.promises[peerId] = element;
    }

    private delete(peerId: string) {
        delete this.promises[peerId];
    }
}