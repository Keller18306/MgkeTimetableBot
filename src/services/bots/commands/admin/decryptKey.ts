import { config } from "../../../../../config";
import { RequestKey, appType } from "../../../../key";
import { formatTime } from "../../../../utils";
import { DefaultCommand, HandlerParams } from "../../abstract/command";

const acceptTool = new RequestKey(config.encrypt_key)

export default class extends DefaultCommand {
    public id = 'decrypt_key'

    public regexp = /^(!|\/)decrypt(key)?/i
    public payload = null;

    public adminOnly: boolean = true;

    handler({ context }: HandlerParams) {
        const key = context.text?.replace(this.regexp, '').trim()
        if (key === undefined) return;

        const data = acceptTool.parseKey(key)

        let rows: string[] = []
        for (const key in data) {
            if (['from', 'time', 'payload'].includes(key)) continue;

            const _data = data as any

            rows.push(`${key}: ${_data[key]}`)
        }

        context.send(
            `from: ${appType[data.from]}\n` +
            rows.join('\n') +
            `\ntime: ${data.time} (${formatTime(new Date(Number(data.time)))})\n` +
            `payload: ${data.payload}`
        )
    }
}