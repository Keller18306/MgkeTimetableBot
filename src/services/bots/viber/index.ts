import express, { Application } from 'express';
import { Bot, Events, ReceivedTextMessage, Response } from 'viber-bot';
import { config } from '../../../../config';
import { defines } from '../../../defines';
import { FromType, InputRequestKey } from '../../../key/index';
import { raspCache } from '../../../updater';
import { createScheduleFormatter } from '../../../utils';
import { AbstractBot, AbstractCommand } from '../abstract';
import { CommandController } from '../controller';
import { Keyboard, StaticKeyboard } from '../keyboard';
import { ViberAction } from './action';
import { ViberChat } from './chat';
import { ViberCommandContext } from './context';
import { ViberEventListener } from './event';

const REDIRECT_URL: string = config.viber.url;
const WEBHOOK_URL: string = config.viber.url + '/webhook';
const AVATAR_URL: string = config.viber.url + '/avatar.png';

export class ViberBot extends AbstractBot {
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

    private bot: Bot;
    private domain?: string;
    private app: Application;

    constructor(app: express.Application) {
        super('viber');

        this.app = app;

        this.bot = new Bot({
            authToken: config.viber.token,
            name: config.viber.name,
            avatar: `https://${config.http.servername}${AVATAR_URL}`,
            registerToEvents: [
                Events.MESSAGE_RECEIVED,
                Events.CONVERSATION_STARTED,
                Events.SUBSCRIBED,
                Events.UNSUBSCRIBED
            ]
        });

        this.bot.on(Events.MESSAGE_RECEIVED, (message, response) => this.handleNewMessage(message, response));
        this.bot.on(Events.CONVERSATION_STARTED, (response, subscribed, context) => this.handleConversationStarted(response, subscribed, context));
        this.bot.on(Events.SUBSCRIBED, (response) => this.handleSubscribe(response));
        this.bot.on(Events.UNSUBSCRIBED, (userId) => this.handleUnsubscribe(userId));
    }

    public run() {
        this.app.use(WEBHOOK_URL, this.bot.middleware());

        this.bot.getBotProfile().then((res) => {
            this.domain = res.uri
            console.log(`[VIBER] Бот '${res.name.trim()}' авторизован. Сообщения отправляются от '${config.viber.name}'`)
            this.app.use(REDIRECT_URL, (request, response) => this.redirect(request, response));
        }, (err) => {
            console.error('[VIBER] Не удалось получить информацию о боте. Вероятно невалидный токен.', err)
        })
        this.setupWebhook()

        new ViberEventListener(this.bot)
    }

    private async setupWebhook() {
        const URL = `https://${config.http.servername}${WEBHOOK_URL}`

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
            return this.input.resolve(context.peerId, message.text, 'message');
        }

        let cmd: AbstractCommand | null = null;
        if (context.payload) {
            cmd = CommandController.searchCommandByPayload(context.payload.action, chat.scene)
        } else {
            cmd = CommandController.searchCommandByMessage(message.text, chat.scene)
        }

        if (chat.needUpdateDeviceInfo()) {
            await this.bot.getUserDetails(response.userProfile).then((res) => {
                chat.setDeviceInfo(res.name, res.primary_device_os, res.viber_version, res.device_type)
            }).catch((err) => {
                console.error('[VIBER] Не удалось получить информацию о пользователе', err)
            })
        }

        this.handleMessage(cmd, {
            context: context,
            realContext: { message, response },
            chat: chat,
            actions: new ViberAction(context, chat),
            keyboard: new Keyboard(context, chat.resync()),
            service: 'viber',
            scheduleFormatter: createScheduleFormatter('viber', raspCache, chat),
            cache: this.cache
        });
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