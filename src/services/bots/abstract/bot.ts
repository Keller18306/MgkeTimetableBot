import { format } from "util";
import { config } from "../../../../config";
import { defines } from "../../../defines";
import { InputRequestKey, RequestKey } from "../../../key";
import { BotInput, InputCancel } from "../input";
import { StaticKeyboard } from "../keyboard";
import { FileCache } from "./cache";
import { AbstractChat } from "./chat";
import { AbstractCommandContext, DefaultCommand, HandlerParams, Service } from "./command";

export type HandleMessageOptions = {
    /** Есть ли упоминание бота в сообщении (для ВК) */
    selfMention?: boolean;

    /** Сообщение отправлено из чата (используется чтобы не отправлять "неизвестную команду", если люди просто общаются в чате) */
    isFromChat?: boolean;
}

export abstract class AbstractBot {
    public abstract run(): void
    protected abstract _getAcceptKeyParams(context: AbstractCommandContext): InputRequestKey;
    
    protected readonly acceptTool: RequestKey = new RequestKey(config.encrypt_key);
    protected readonly input: BotInput = new BotInput();
    protected readonly cache: FileCache;

    public service: Service;

    constructor(service: Service) {
        this.service = service;
        this.cache = new FileCache(this.service);
    }

    protected async handleMessage(cmd: DefaultCommand | null, handlerParams: HandlerParams, options: HandleMessageOptions = {}) {
        const { chat, context, keyboard } = handlerParams;
        const { selfMention } = Object.assign({}, {
            selfMention: true
        }, options);

        if (!chat.allowSendMess) {
            chat.allowSendMess = true
        }
        
        if (chat.accepted && chat.needUpdateButtons) {
            chat.needUpdateButtons = false;
            chat.scene = null;
            context.send('Клавиатура была принудительно пересоздана (обновлена)', {
                keyboard: keyboard.MainMenu
            });
        }

        if (!cmd) {
            if (selfMention || !context.isChat) {
                if (chat.accepted) {
                    return this.notFound(chat, context, keyboard.MainMenu, selfMention)
                } else {
                    return this.notAccepted(context)
                }
            }

            return;
        }

        if (cmd.acceptRequired && !chat.accepted) {
            if (context.isChat && !selfMention) return;

            return this.notAccepted(context)
        }

        chat.lastMsgTime = Date.now()

        try {
            if (!cmd.preHandle(handlerParams)) {
                return this.notFound(chat, context, keyboard.MainMenu, selfMention);
            }

            await cmd.handler(handlerParams)
        } catch (err: any) {
            if (err instanceof InputCancel) return;
            console.error(cmd.id, context.peerId, err);

            this.handleMessageError(cmd, context, err)
        }
    }

    protected handleMessageError(cmd: DefaultCommand, context: AbstractCommandContext, err: Error) {
        context.send(`Произошла ошибка во время выполнения Command #${cmd.id}: ${err.toString()}`).catch(() => { })
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
        context.send(format(defines['need.accept'],
            this.acceptTool.getKey(this._getAcceptKeyParams(context))
        ), {
            disable_mentions: true,
            keyboard: StaticKeyboard.NeedAccept
        })
    }
}