import { config } from "../../../../../config";
import { StringDate } from "../../../../utils";
import { RequestKey, appType } from "../../../key";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";

const acceptTool = new RequestKey(config.encrypt_key)

export default class extends AbstractCommand {
    public regexp = /^(!|\/)decrypt(key)?/i
    public payload = null;

    public adminOnly: boolean = true;

    handler({ context }: CmdHandlerParams) {
        const key = context.text?.replace(this.regexp, '').trim()
        if (key === undefined) return;

        const data = acceptTool.parseKey(key)

        let rows: string[] = []
        for (const key in data) {
            if (['from', 'time', 'payload'].includes(key)) continue;

            const _data = data as any

            rows.push(`${key}: ${_data[key]}`)
        }

        return context.send(
            `from: ${appType[data.from]}\n` +
            rows.join('\n') +
            `\ntime: ${data.time} (${StringDate.fromUnixTime(data.time).toStringDateTime()})\n` +
            `payload: ${data.payload}`
        )
    }
}