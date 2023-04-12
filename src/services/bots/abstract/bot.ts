import { format } from "util";
import { config } from "../../../../config";
import { defines } from "../../../defines";
import { InputRequestKey, RequestKey } from "../../../key";
import { BotInput } from "../input";
import { AbstractCommandContext } from "./command";
import { StaticKeyboard } from "../keyboard";

export abstract class AbstractBot<Context extends AbstractCommandContext> {
    public abstract run(): void
    protected abstract _getAcceptKeyParams(context: Context): InputRequestKey;

    protected readonly acceptTool: RequestKey;
    protected readonly input: BotInput;

    constructor() {
        this.acceptTool = new RequestKey(config.encrypt_key)
        this.input = new BotInput()
    }

    protected notFound(context: Context, keyboard: any, selfMention: boolean = true) {
        return context.send('Команда не найдена', {
            ...(selfMention ? {
                keyboard: keyboard
            } : {})
        })
    }

    protected notAccepted(context: Context) {
        context.send(format(defines['need.accept'],
            this.acceptTool.getKey(this._getAcceptKeyParams(context))
        ), {
            disable_mentions: true,
            keyboard: StaticKeyboard.NeedAccept
        })
    }
}