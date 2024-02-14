import express from 'express';
import { Bot, Events, ReceivedTextMessage, Response } from 'viber-bot';
import { config } from '../../../../config';
import { App, AppService } from '../../../app';
import { defines } from '../../../defines';
import { createScheduleFormatter } from '../../../utils';
import { FromType, InputRequestKey } from '../../key/index';
import { raspCache } from '../../parser';
import { AbstractBot } from '../abstract';
import { AbstractBotEventListener } from '../events';
import { Keyboard, StaticKeyboard } from '../keyboard';
import { ViberAction } from './action';
import { ViberChat } from './chat';
import { ViberCommandContext } from './context';
import { ViberEventListener } from './event';

const VIBER_URL = config.viber.url;
const REDIRECT_URL: string = VIBER_URL;
const WEBHOOK_URL: string = VIBER_URL + '/webhook';
const AVATAR_URL: string = VIBER_URL + '/avatar.png';

export class ViberBot extends AbstractBot implements AppService {
    public event: AbstractBotEventListener;

    private bot: Bot;
    private domain?: string;
    // private app: Application;
    // private httpServer: HttpService;

    constructor(app: App) {
        super(app, 'viber');

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

        this.event = new ViberEventListener(this.app, this.bot);
    }

    public async run() {
        this.bot.on(Events.MESSAGE_RECEIVED, (message, response) => this.handleNewMessage(message, response));
        this.bot.on(Events.CONVERSATION_STARTED, (response, subscribed, context) => this.handleConversationStarted(response, subscribed, context));
        this.bot.on(Events.SUBSCRIBED, (response) => this.handleSubscribe(response));
        this.bot.on(Events.UNSUBSCRIBED, (userId) => this.handleUnsubscribe(userId));

        const httpService = this.app.getService('http');
        httpService.ignoreJsonParserUrls.push(VIBER_URL); //fix for viber
        const server = httpService.getServer();

        if (config.viber.noticer) {
            this.getBotService().events.registerListener(this.event);
        }

        await this.getBotService().init();

        await this.bot.getBotProfile().then((res) => {
            this.domain = res.uri
            console.log(`[VIBER] Бот '${res.name.trim()}' авторизован. Сообщения отправляются от '${config.viber.name}'`)
        }, (err) => {
            console.error('[VIBER] Не удалось получить информацию о боте. Вероятно невалидный токен.', err)
        });
        
        server.use(WEBHOOK_URL, this.bot.middleware());
        server.use(REDIRECT_URL, this.redirect.bind(this));
        
        await this.setupWebhook();
    }
    
    public getChat(peerId: string): ViberChat {
        return new ViberChat(peerId);
    }

    private async setupWebhook() {
        const URL = `https://${config.http.servername}${WEBHOOK_URL}`

        await this.bot.setWebhook(URL).then((res) => {
            console.log(`[VIBER] Webhook set to ${URL}`)
        }, (err) => {
            console.error(`[VIBER] Webhook set error`, err)
        })
    }

    private async handleNewMessage(message: ReceivedTextMessage, response: Response) {
        const chat = this.getChat(response.userProfile.id);
        const context = new ViberCommandContext(this, message, response, chat);

        if (chat.needUpdateDeviceInfo()) {
            await this.bot.getUserDetails(response.userProfile).then((res) => {
                chat.setDeviceInfo(res.name, res.primary_device_os, res.viber_version, res.device_type)
            }).catch((err) => {
                console.error('[VIBER] Не удалось получить информацию о пользователе', err)
            })
        }

        this.handleMessage({
            context: context,
            realContext: { message, response },
            chat: chat,
            actions: new ViberAction(context, chat),
            keyboard: new Keyboard(this.app, chat.resync(), context),
            service: 'viber',
            scheduleFormatter: createScheduleFormatter('viber', this.app, raspCache, chat),
            cache: this.cache
        });
    }

    private async handleConversationStarted(response: Response, subscribed: boolean, _context: string) {
        const chat = this.getChat(response.userProfile.id);
        const context = new ViberCommandContext(this, null, response, chat);

        chat.resync();

        chat.allowSendMess = subscribed;

        if (chat.ref === null) {
            chat.ref = _context?.slice(0, 255) || 'none';
        }

        return context.send(defines['viber.first.message'], {
            keyboard: StaticKeyboard.StartButton,
        });
    }

    private async handleSubscribe(response: Response) {
        const chat = this.getChat(response.userProfile.id)

        chat.resync()

        chat.allowSendMess = true
    }

    private async handleUnsubscribe(userId: string) {
        const chat = this.getChat(userId)

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