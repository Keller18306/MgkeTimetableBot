import { ImageFile } from '../../image/builder';
import { BotInput } from '../input';
import { KeyboardBuilder } from './keyboardBuilder';

export type MessageOptions = {
    keyboard?: KeyboardBuilder,
    reply_to?: string,
    disable_mentions?: boolean,
    disable_intents?: boolean,
    disableHtmlParser?: boolean
}

export abstract class AbstractContext {
    public abstract peerId: number | string;
    public abstract userId: number | string;

    public abstract get isChat(): boolean;

    public abstract send(text: string, options?: MessageOptions): Promise<string>
    public abstract sendPhoto(image: ImageFile, options?: MessageOptions): Promise<string>
    public abstract delete(id: string): Promise<boolean>
    public abstract isChatAdmin(): Promise<boolean>

    public readonly _input: BotInput;

    constructor(input: BotInput) {
        this._input = input;
    }

    public async input(text: string, options?: MessageOptions | undefined): Promise<string | undefined> {
        const answer = this._input.create(String(this.peerId))

        await this.send(text, options)

        return answer
    }

    public cancelInput() {
        this._input.cancel(String(this.peerId))
    }

    public async waitInput() {
        return this._input.create(String(this.peerId));
    }
}

export abstract class AbstractCommandContext extends AbstractContext {
    public abstract text: string
    public abstract payload?: { [key: string]: any };
}

export abstract class AbstractCallbackContext extends AbstractContext {
    public abstract payload: any;
    public abstract answer(text: string): Promise<boolean>

}
