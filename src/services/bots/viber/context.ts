import { Message, ReceivedTextMessage, Response } from "viber-bot";
import { ViberBot } from ".";
import { ParsedPayload, parsePayload } from "../../../utils";
import { ImageFile } from "../../image/builder";
import { AbstractCommandContext, KeyboardBuilder, MessageOptions } from "../abstract";
import { BotChat } from "../chat";
import { Keyboard, StaticKeyboard } from "../keyboard";
import { convertAbstractToViber } from "./keyboard";

export type ViberContext = {
    message: ReceivedTextMessage,
    response: Response
}

export class ViberCommandContext extends AbstractCommandContext {
    public id: string;
    public text: string;
    public parsedPayload?: ParsedPayload;
    public peerId: string;
    public userId: string;
    public messageId: undefined;
    
    private response: Response;
    private chat: BotChat;

    constructor(bot: ViberBot, message: ReceivedTextMessage | null, response: Response, chat: BotChat) {
        super(bot);

        this.id = '';
        this.text = message?.text || '';

        this.peerId = response.userProfile.id;
        this.userId = response.userProfile.id;

        this.response = response;
        this.chat = chat;

        let matchedPayload: null | RegExpMatchArray = null;
        if (matchedPayload = this.text.match(/^payload\:(.*)/i)) {
            this.parsedPayload = parsePayload(matchedPayload[1]);
        }
    }

    get isChat(): boolean {
        return false;
    }

    public async send(text: string, options: MessageOptions = {}): Promise<string> {
        let keyboard: KeyboardBuilder | undefined = options.keyboard;
        if (!keyboard || keyboard.isInline) {
            if (keyboard && keyboard.withCancelButton) {
                keyboard = StaticKeyboard.Cancel;
            } else { 
                keyboard = new Keyboard(this.app, this.chat, this).MainMenu;
            }
        }

        const response = await this.response.send(new Message.Text(
            text, convertAbstractToViber(keyboard)
        ));

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
            keyboard = new Keyboard(this.app, this.chat, this).MainMenu
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