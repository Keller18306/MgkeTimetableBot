import { App } from '../../../app';
import { ParsedPayload } from '../../../utils';
import { ImageFile } from '../../image/builder';
import { BotInput, InputResolvedValue } from '../input';
import { Storage } from '../storage';
import { AbstractBot } from './bot';
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
    public abstract messageId?: any;
    public abstract parsedPayload?: ParsedPayload;

    public get payload(): undefined | any {
        if (!this.parsedPayload) return;

        return this.parsedPayload.data;
    }

    public abstract get isChat(): boolean;

    public abstract send(text: string, options?: MessageOptions): Promise<string>;
    public abstract sendPhoto(image: ImageFile, options?: MessageOptions): Promise<string>;
    public abstract editOrSend(text: string, options?: MessageOptions): Promise<boolean>;
    public abstract delete(id?: string): Promise<boolean>;
    public abstract isChatAdmin(): Promise<boolean>;

    public readonly _input: BotInput;
    protected readonly app: App;
    protected readonly cache: Storage;

    constructor(bot: AbstractBot) {
        this._input = bot.input;
        this.app = bot.app;
        this.cache = bot.cache;
    }

    public async input(text: string, options?: MessageOptions | undefined): Promise<InputResolvedValue> {
        const answer = this.waitInput();

        await this.send(text, options);

        return answer;
    }

    public cancelInput() {
        this._input.cancel(String(this.peerId));
    }

    public waitInput() {
        return this._input.create(String(this.peerId));
    }
}

export abstract class AbstractCommandContext extends AbstractContext {
    public abstract text: string;
}

export abstract class AbstractCallbackContext extends AbstractContext {
    public abstract callbackAnswered: boolean;
    public abstract answer(text?: string): Promise<boolean>;
}
