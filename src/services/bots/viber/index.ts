import express, { Application } from 'express';
import { format } from 'util';
import { Bot, Events, ReceivedTextMessage, Response } from 'viber-bot';
import { config } from '../../../../config';
import { defines } from '../../../defines';
import { FromType, InputRequestKey } from '../../../key/index';
import { raspCache } from '../../../updater';
import { createScheduleFormatter } from '../../../utils/';
import { AbstractBot } from '../abstract/bot';
import { AdvancedContext, DefaultCommand, HandlerParams } from '../abstract/command';
import { CommandController } from '../command';
import { InputCancel } from '../input';
import { Keyboard, StaticKeyboard } from '../keyboard';
import { ViberAction } from './action';
import { ViberChat } from './chat';
import { ViberCommandContext, ViberContext } from './context';
import { ViberEventListener } from './event';

export class ViberBot extends AbstractBot<ViberCommandContext> {
    private static _instance?: ViberBot;

    public static get instance(): ViberBot {
        if (!this._instance) {
            throw new Error('ViberBot is not initialized')
        }

        return this._instance
    }

    public static create(app: express.Application) {
        this._instance = new ViberBot(app)

        return this._instance;
    }

    private REDIRECT_URL = config.viber.url
    private WEBHOOK_URL = config.viber.url + '/webhook'
    private AVATAR_URL = config.viber.url + '/avatar.png'

    private bot: Bot;
    private domain?: string;
    private app: Application;

    constructor(app: express.Application) {
        super();

        this.app = app;

        this.bot = new Bot({
            authToken: config.viber.token,
            name: config.viber.name,
            avatar: `https://${config.http.servername}${this.AVATAR_URL}`,
            registerToEvents: ['message', 'subscribed', 'unsubscribed', 'conversation_started']
        });

        this.bot.on(Events.MESSAGE_RECEIVED, (message, response) => this.handleNewMessage(message, response));
        this.bot.on(Events.CONVERSATION_STARTED, (response, subscribed, context) => this.handleConversationStarted(response, subscribed, context));
        this.bot.on(Events.SUBSCRIBED, (response) => this.handleSubscribe(response));
        this.bot.on(Events.UNSUBSCRIBED, (userId) => this.handleUnsubscribe(userId));
    }

    public run() {
        this.app.use(this.WEBHOOK_URL, this.bot.middleware());

        this.bot.getBotProfile().then((res) => {
            this.domain = res.uri
            console.log(`[VIBER] Бот '${res.name.trim()}' авторизован. Сообщения отправляются от '${config.viber.name}'`)
            this.app.use(this.REDIRECT_URL, (request, response) => this.redirect(request, response));
        }, (err) => {
            console.error('[VIBER] Не удалось получить информацию о боте. Вероятно невалидный токен.', err)
        })
        this.setupWebhook()

        new ViberEventListener(this.bot)
    }

    private async setupWebhook() {
        const URL = `https://${config.http.servername}${this.WEBHOOK_URL}`

        this.bot.setWebhook(URL).then((res) => {
            console.log(`[VIBER] Webhook set to ${URL}`)
        }, (err) => {
            console.error(`[VIBER] Webhook set error`, err)
        })
    }

    private async handleNewMessage(message: ReceivedTextMessage, response: Response) {
        const chat = new ViberChat(response.userProfile.id)
        const context = new ViberCommandContext(message, response, chat, this.input)

        if (!context.payload && chat.accepted && this.input.has(context.peerId)) {
            return this.input.resolve(context.peerId, message.text);
        }

        let cmd: DefaultCommand | null = null;
        if (context.payload) {
            cmd = CommandController.searchCommandByPayload(context.payload.action, chat.scene)
        } else {
            cmd = CommandController.searchCommandByMessage(message.text, chat.scene)
        }

        const adv_context: AdvancedContext = {
            hasMention: false,
            selfMention: false,
            mentionId: 0,
        }
        const keyboard = new Keyboard(context, chat.resync())

        if (chat.needUpdateDeviceInfo()) {
            await this.bot.getUserDetails(response.userProfile).then((res) => {
                chat.setDeviceInfo(res.name, res.primary_device_os, res.viber_version, res.device_type)
            }).catch((err) => {
                console.error('[VIBER] Не удалось получить информацию о пользователе', err)
            })
        }

        if (!chat.allowSendMess) {
            chat.allowSendMess = true
        }

        if (!cmd) {
            if (chat.accepted) {
                return this.notFound(context, keyboard.MainMenu)
            } else {
                return context.send(
                    format(defines['need.accept'],
                        this.acceptTool.getKey({
                            from: FromType.ViberBot,
                            user_id: context.userId,
                            time: Date.now()
                        })
                    )
                )
            }
        }

        if (cmd.adminOnly && !chat.isAdmin) {
            return this.notFound(context, keyboard.MainMenu);
        }

        if (!cmd.services.includes('viber')) {
            return this.notFound(context, keyboard.MainMenu);
        }

        const real_context: ViberContext = {
            message, response
        }

        const params: HandlerParams = {
            context: context,
            realContext: real_context,
            adv_context: adv_context,
            chat: chat,
            chatData: chat.resync(),
            actions: new ViberAction(context, chat),
            keyboard: keyboard,
            service: 'viber',
            scheduleFormatter: createScheduleFormatter('viber', raspCache, chat)
        };

        (async () => {
            try {
                if (cmd.acceptRequired && !chat.accepted) {
                    if (context.isChat && !adv_context.selfMention) return;

                    return this.notAccepted(context)
                }

                chat.lastMsgTime = Date.now()

                if (!cmd.preHandle(params)) return this.notFound(context, keyboard.MainMenu);

                await cmd.handler(params)
            } catch (e: any) {
                if (e instanceof InputCancel) return;

                console.error(cmd.id, e)
                context.send(`Произошла ошибка во время выполнения Command #${cmd.id}: ${e.toString()}`).catch(() => { })
            }
        })()
    }

    private async handleConversationStarted(response: Response, subscribed: boolean, _context: string) {
        const chat = new ViberChat(response.userProfile.id)
        const context = new ViberCommandContext(null, response, chat, this.input)

        chat.resync()

        chat.allowSendMess = subscribed

        if (chat.ref === null) {
            chat.ref = _context?.slice(0, 255) || 'none'
        }

        return context.send(defines['viber.first.message'], {
            keyboard: StaticKeyboard.StartButton,
        })
    }

    private async handleSubscribe(response: Response) {
        const chat = new ViberChat(response.userProfile.id)

        chat.resync()

        chat.allowSendMess = true
    }

    private async handleUnsubscribe(userId: string) {
        const chat = new ViberChat(userId)

        chat.resync()

        chat.allowSendMess = false
    }

    protected _getAcceptKeyParams(context: ViberCommandContext): InputRequestKey {
        return {
            from: FromType.ViberBot,
            user_id: context.userId,
            time: Date.now()
        }
    }

    private redirect(request: express.Request, response: express.Response) {
        let url = `viber://pa?chatURI=${this.domain}`

        if (request.query.ref && typeof request.query.ref === 'string') {
            url += '&context=' + encodeURIComponent(request.query.ref)
        }

        response.redirect(url)
    }
}