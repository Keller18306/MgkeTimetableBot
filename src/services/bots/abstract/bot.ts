import { format } from "util";
import { config } from "../../../../config";
import { App } from "../../../app";
import { defines } from "../../../defines";
import { InputRequestKey, RequestKey } from "../../key";
import { AbstractBotEventListener } from "../events";
import { BotInput, InputCancel } from "../input";
import { StaticKeyboard } from "../keyboard";
import { Storage } from "../storage";
import { AbstractCallback, CbHandlerParams } from "./callback";
import { AbstractChat } from "./chat";
import { AbstractCommand, BotServiceName, CmdHandlerParams } from "./command";
import { AbstractCallbackContext, AbstractCommandContext } from "./context";

export type HandleMessageOptions = {
    /** Есть ли упоминание бота в сообщении (для ВК) */
    selfMention?: boolean;

    /** Сообщение отправлено из чата (используется чтобы не отправлять "неизвестную команду", если люди просто общаются в чате) */
    isFromChat?: boolean;
}

export abstract class AbstractBot {
    protected abstract _getAcceptKeyParams(context: AbstractCommandContext): InputRequestKey;
    public abstract getChat(peerId: number | string): AbstractChat;
    public abstract event: AbstractBotEventListener;

    protected readonly acceptTool: RequestKey = new RequestKey(config.encrypt_key);
    public readonly input: BotInput = new BotInput();
    public readonly cache: Storage;
    public readonly app: App;

    public service: BotServiceName;

    constructor(app: App, service: BotServiceName) {
        this.app = app;
        this.service = service;
        this.cache = new Storage(this.service);
    }

    protected getBotService() {
        return this.app.getService('bot');
    }

    private getCommand(context: AbstractCommandContext, chat: AbstractChat): AbstractCommand | null {
        let cmd: AbstractCommand | null = null;

        if (context.parsedPayload) {
            cmd = this.getBotService().searchCommandByPayload(context.parsedPayload, chat.scene);
        }

        if (!cmd) {
            cmd = this.getBotService().searchCommandByMessage(context.text, chat.scene);
        }

        return cmd;
    }

    private getCallback(context: AbstractCallbackContext): AbstractCallback | null {
        return this.getBotService().getCallbackByPayload(context.parsedPayload);
    }

    protected async handleMessage(handlerParams: CmdHandlerParams, options: HandleMessageOptions = {}) {
        const { chat, context, keyboard } = handlerParams;
        const { selfMention } = Object.assign({}, {
            selfMention: true
        }, options);

        try {
            if (!chat.allowSendMess) {
                chat.allowSendMess = true;
            }

            if (chat.accepted && !chat.eula) {
                chat.eula = true;
                
                context.send(defines.eula).catch(() => { });
            }
            
            if (chat.accepted && chat.needUpdateButtons) {
                chat.needUpdateButtons = false;
                chat.scene = null;
                
                context.send('Клавиатура была принудительно пересоздана (обновлена)', {
                    keyboard: keyboard.MainMenu
                }).catch(() => { });
            }
            
            const cmd = this.getCommand(context, chat);
            if (!cmd) {
                if (selfMention || !context.isChat) {
                    if (chat.accepted) {
                        if (this.input.has(String(context.peerId))) {
                            return this.input.resolve(String(context.peerId), context.text, 'message');
                        }

                        return this.notFound(chat, context, keyboard.MainMenu, selfMention);
                    } else {
                        return this.notAccepted(context);
                    }
                }

                return;
            }

            if (cmd.acceptRequired && !chat.accepted) {
                if (context.isChat && !selfMention) return;

                return this.notAccepted(context);
            }

            chat.lastMsgTime = Date.now();

            try {
                if (!cmd.preHandle(handlerParams)) {
                    return this.notFound(chat, context, keyboard.MainMenu, selfMention);
                }

                await cmd.handler(handlerParams);
            } catch (err: any) {
                if (err instanceof InputCancel) return;
                console.error(cmd.id, context.peerId, err);

                this.handleMessageError(cmd, context, err);
            }
        } catch (err: any) {
            console.error('sys send error', context.peerId, err);
        }
    }

    protected async handleCallback(handlerParams: CbHandlerParams) {
        const { chat, context } = handlerParams;

        try {
            if (!chat.allowSendMess) {
                chat.allowSendMess = true;
            }

            if (chat.accepted && !chat.eula) {
                chat.eula = true;
                context.send(defines.eula).catch(() => { });
            }

            const cb = this.getCallback(context);
            if (!cb) {
                await context.answer('Callback not found');

                return;
            }

            if (cb.acceptRequired && !chat.accepted) {
                await context.answer('Чат не подтверждён, чтобы использовать это');
                
                return;
            }

            chat.lastMsgTime = Date.now();

            try {
                if (!cb.preHandle(handlerParams)) {
                    await context.answer('Вы не можете использовать это');

                    return;
                }

                await cb.handler(handlerParams)
            } catch (err: any) {
                if (err instanceof InputCancel) return;
                console.error(cb.id, context.peerId, err);

                this.handleMessageError(cb, context, err)
            }

            if (!context.callbackAnswered) {
                await context.answer().catch(() => { });
            }
        } catch (err: any) {
            console.error('sys send error', context.peerId, err);
        }
    }

    protected handleMessageError(cmd: AbstractCommand | AbstractCallback, context: AbstractCommandContext | AbstractCallbackContext, err: Error) {
        const name = (cmd as any).__proto__.__proto__.constructor.name.replace(/^Abstract/, '').toLowerCase();

        if (context instanceof AbstractCallbackContext) {
            context.answer('Произошла ошибка').catch(() => { })
        }

        context.send(`🚫 Произошла ошибка во время выполнения ${name}#${cmd.id}: ${err.toString()}`).catch(() => { })
    }

    protected notFound(chat: AbstractChat, context: AbstractCommandContext, keyboard: any, selfMention: boolean = true) {
        chat.scene = null; //set main scene

        return context.send('Команда не найдена', {
            ...(selfMention ? {
                keyboard: keyboard
            } : {})
        })
    }

    protected notAccepted(context: AbstractCommandContext) {
        return context.send(format(defines['need.accept'],
            this.acceptTool.getKey(this._getAcceptKeyParams(context))
        ), {
            disable_mentions: true,
            keyboard: StaticKeyboard.NeedAccept
        })
    }
}