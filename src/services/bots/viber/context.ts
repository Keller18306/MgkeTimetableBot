import { Message, ReceivedTextMessage, Response } from "viber-bot";
import { ImageFile } from "../../image/builder";
import { AbstractCommandContext, KeyboardBuilder, MessageOptions } from "../abstract";
import { BotInput } from "../input";
import { Keyboard } from "../keyboard";
import { ViberChat } from "./chat";
import { convertAbstractToViber } from "./keyboard";
import { App } from "../../../app";

export type ViberContext = {
    message: ReceivedTextMessage,
    response: Response
}

export class ViberCommandContext extends AbstractCommandContext {
    public id: string;
    public text: string;
    public payload?: { [key: string]: any };
    public peerId: string;
    public userId: string;

    protected lastSentMessageId: undefined;

    private response: Response;
    private chat: ViberChat;

    constructor(message: ReceivedTextMessage | null, response: Response, app: App, chat: ViberChat, input: BotInput) {
        super(app, input)
        this.id = ''
        this.text = message?.text || ''

        let matchedPayload: null | RegExpMatchArray = null;
        if (matchedPayload = this.text.match(/^payload\:(.*)/i)) {
            const payload = JSON.parse(matchedPayload[1])

            if (typeof payload === 'object' && payload.action != null) {
                this.payload = payload
            }
        }

        this.peerId = response.userProfile.id
        this.userId = response.userProfile.id

        this.response = response
        this.chat = chat
    }

    get isChat(): boolean {
        return false
    }

    public async send(text: string, options: MessageOptions = {}): Promise<string> {
        let keyboard: KeyboardBuilder | undefined = options.keyboard
        if (!keyboard || keyboard.isInline) {
            keyboard = new Keyboard(this.app, this.chat.resync(), this).MainMenu
        }

        const response = await this.response.send(new Message.Text(
            text, convertAbstractToViber(keyboard)
        ))

        return response[0].toString();
    }

    //viber doesn't support message edit - using send new message
    public async editOrSend(text: string, options?: MessageOptions | undefined): Promise<boolean> {
        await this.send(text, options);
        return true;
    }

    public async sendPhoto(image: ImageFile, options: MessageOptions = {}): Promise<string> {
        let keyboard: KeyboardBuilder | undefined = options.keyboard
        if (!keyboard || keyboard.isInline) {
            keyboard = new Keyboard(this.app, this.chat.resync(), this).MainMenu
        }

        const response = await this.response.send(new Message.Picture(
            'https://mgke.keller.by/image/',
            undefined, undefined,
            convertAbstractToViber(keyboard)
        ))

        return response[0].toString();
    }

    //viber doesn't support message delete
    public async delete(id: string): Promise<boolean> {
        return false;
    }

    public async isChatAdmin(): Promise<boolean> {
        return false;
    }
}