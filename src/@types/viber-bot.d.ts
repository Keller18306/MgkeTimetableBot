declare module 'viber-bot' {
    enum Events {
        MESSAGE_RECEIVED = "message",
        MESSAGE_SENT = "message_sent",
        SUBSCRIBED = "subscribed",
        UNSUBSCRIBED = "unsubscribed",
        CONVERSATION_STARTED = "conversation_started",
        ERROR = "error",
        FAILED = "failed"
    }

    type EventsList = 'subscribed' | 'unsubscribed' | 'conversation_started' | 'message' | 'delivered' | 'seen'

    interface UserProfile {
        id: string,
        name: string,
        avatar: string,
        /** iso alpha 2 code */
        country: string,
        language: string,
        apiVersion: number;
    }

    interface ReceivedTextMessage {
        text: string,
        /** milliseconds */
        timestamp: number,
        token: string,
        trackingData: any,
        keyboard: any,
        requiredArguments: string[],
        minApiVersion: undefined;
    }

    type ConversationStarted = (userProfile: UserProfile,
        isSubscribed: boolean,
        context: any,
        onFinish: any) => any;

    type BotConfiguration = {
        authToken: string,
        name: string,
        avatar: string,
        registerToEvents?: EventsList[]
    }

    type UserDetails = {
        id: string,
        name: string,
        avatar: string,
        language: string,
        country: string,
        primary_device_os: string,
        api_version: number,
        viber_version: string,
        mcc: number,
        mnc: number,
        device_type: string
    }

    type BotProfile = {
        status: number,
        status_message: string,
        id: string,
        chat_hostname: string,
        name: string,
        uri: string,
        icon: string,
        background: string,
        category: string,
        subcategory: string,
        location: { lat: number, lon: number },
        country: string,
        webhook: string,
        event_types: EventsList[],
        members: {
            id: string,
            name: string,
            avatar: string,
            role: string
        }[],
        subscribers_count: number
    }

    class Bot {
        constructor(configuration: BotConfiguration)
        onConversationStarted: (fn: ConversationStarted) => void;
        onTextMessage: (pattern: RegExp, callback: (message: ReceivedTextMessage, response: any) => any) => any;
        middleware: () => any;
        onError: (callback: (error: any) => any) => any;
        setWebhook: (webhook: string) => Promise<any>;
        onSubscribe: (callback: (response: Response) => void) => void;
        sendMessage: (minUserProfile: { id: string }, messages: any[]) => Promise<any>;
        onUnsubscribe: (callback: (userId: string) => void) => void;

        on(eventName: Events.MESSAGE_RECEIVED, handler: (message: ReceivedTextMessage, response: Response, silent: boolean, reply_type: any, chat_id: any) => any): void;
        on(eventName: Events.CONVERSATION_STARTED, handler: (response: Response, subscribed: boolean, context: string) => any): void;
        on(eventName: Events.SUBSCRIBED, handler: (response: Response) => any): void
        on(eventName: Events.UNSUBSCRIBED, handler: (id: string) => any): void
        on(eventName: string, handler: (...args: any[]) => any): void;

        getBotProfile(): Promise<BotProfile>;
        getUserDetails(args: { id: string }): Promise<UserDetails>;
    }

    interface Keyboard {
        Type: 'keyboard';
        DefaultHeight?: boolean;
        /** hex color */
        BgColor: string;
        Buttons: KeyboardButton[];
        InputFieldState?: 'hidden' | 'regular' | 'minimized',
    }

    interface KeyboardButton {
        Columns?: number,
        Rows?: number,
        ActionType?: "reply" | "open-url" | "none",
        ActionBody: string,
        /** hex color */
        BgColor?: string;
        Text?: string;
        TextVAlign?: string,
        TextHAlign?: string,
        TextSize?: 'regular'
        Silent?: boolean;
        OpenURLType?: string,
        InternalBrowser?: {
            ActionButton?: string;
            ActionPredefinedURL?: string;
            Mode?: string;
            CustomTitle?: string,
        }
    }

    interface RichMedia {
        ButtonsGroupColumns: number,
        ButtonsGroupRows: number,
        BgColor: string,
        Buttons: RichMediaButton[]
    }

    interface RichMediaButton {
        Columns?: number;
        Rows?: number;
        ActionType?: "reply" | "open-url" | "none";
        ActionBody?: string;
        Image?: string;
        OpenURLType?: string;
        Text?: string;
        TextSize?: string;
        TextVAlign?: string;
        TextHAlign?: string;
        BgColor?: string;
        InternalBrowser?: {
            ActionButton: string;
            ActionPredefinedURL?: string;
        }
        Silent?: boolean;
    }

    interface Response {
        userProfile: UserProfile,
        send: (messages: any | any[]) => Promise<[number]>;
    }

    interface StickerMessage {
        new(stickerId: number): StickerMessage;
    }

    interface KeyboardMessage {
        new(
            keyboard: Keyboard,
            optionalTrackingData?: string,
            timestamp?: string,
            token?: string,
            minApiVersion?: number,
        ): KeyboardMessage;
    }

    interface RichMediaMessage {
        new(
            richMedia: RichMedia,
            optionalKeyboard?: Keyboard,
            optionalTrackingData?: string,
            timestamp?: string,
            token?: string,
            optionalAltText?: string,
            minApiVersion?: number,
        ): RichMediaMessage;
    }

    class TextMessage {
        constructor(
            message: string,
            keyboard?: Keyboard,
            optionalTrackingData?: string,
            timestamp?: string,
            token?: string,
            minApiVersion?: number
        );
    }

    class PictureMessage {
        constructor(
            url: string,
            optionalText?: string,
            optionalThumbnail?: string,
            optionalKeyboard?: Keyboard,
            optionalTrackingData?: string,
            timestamp?: string,
            token?: string,
            minApiVersion?: number
        );
    }

    class Message {
        static Text: typeof TextMessage
        static Picture: typeof PictureMessage
    }
}

