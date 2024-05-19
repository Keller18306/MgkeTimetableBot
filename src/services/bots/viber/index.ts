import express from 'express';
import { CreationAttributes } from 'sequelize';
import { Bot, Events, ReceivedTextMessage, Response } from 'viber-bot';
import { config } from '../../../../config';
import { App, AppService } from '../../../app';
import { defines } from '../../../defines';
import { createScheduleFormatter } from '../../../formatter';
import { FromType, InputRequestKey } from '../../../key/index';
import { raspCache } from '../../parser';
import { AbstractBot } from '../abstract';
import { BotChat } from '../chat';
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

    public async getChat(peerId: string, creationDefaults?: Partial<CreationAttributes<BotChat>>): Promise<BotChat<ViberChat>> {
        return BotChat.findByServicePeerId(ViberChat, peerId, creationDefaults);
    }

    private async setupWebhook() {
        const URL = `https://${config.http.servername}${WEBHOOK_URL}`

        await this.bot.setWebhook(URL).then((res) => {
            console.log(`[VIBER] Вебхук установлен на ${URL}`)
        }, (err) => {
            console.error(`[VIBER] Ошибка установки вебхука`, err)
        })
    }

    private async handleNewMessage(message: ReceivedTextMessage, response: Response) {
        const chat = await this.getChat(response.userProfile.id, {
            accepted: config.accept.private,
            allowSendMess: true
        });

        const context = new ViberCommandContext(this, message, response, chat);

        if (chat.serviceChat.needUpdateUserDetails()) {
            const userDetails = await this.bot.getUserDetails(response.userProfile).catch((err) => {
                console.error('[VIBER] Не удалось получить информацию о пользователе', err)
            });

            if (userDetails) {
                await chat.serviceChat.setUserDetails(userDetails);
            }
        }

        this.handleMessage({
            context: context,
            realContext: { message, response },
            chat: chat,
            serviceChat: chat.serviceChat,
            actions: new ViberAction(context, chat),
            keyboard: new Keyboard(this.app, chat, context),
            service: 'viber',
            formatter: createScheduleFormatter('viber', this.app, raspCache, chat),
            cache: this.cache
        });
    }

    private async handleConversationStarted(response: Response, subscribed: boolean, _context: string) {
        const chat = await this.getChat(response.userProfile.id, {
            accepted: config.accept.private,
            allowSendMess: subscribed
        });

        const context = new ViberCommandContext(this, null, response, chat);

        chat.allowSendMess = subscribed;

        if (chat.ref === null) {
            chat.ref = _context?.slice(0, 255) || 'none';
        }

        await chat.save();

        return context.send(defines['viber.first.message'], {
            keyboard: StaticKeyboard.StartButton,
        });
    }

    private async handleSubscribe(response: Response) {
        const chat = await this.getChat(response.userProfile.id, {
            accepted: config.accept.private,
            allowSendMess: true
        });

        await chat.update({ allowSendMess: true });
    }

    private async handleUnsubscribe(userId: string) {
        const chat = await this.getChat(userId, {
            accepted: config.accept.private,
            allowSendMess: false
        });

        await chat.update({ allowSendMess: false });
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