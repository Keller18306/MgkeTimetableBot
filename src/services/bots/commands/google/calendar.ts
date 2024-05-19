import { AppServiceName } from "../../../../app";
import { AbstractCommand, CmdHandlerParams } from "../../abstract";
import GoogleCalendarCallback from "../../callbacks/google";

export default class extends AbstractCommand {
    public regexp = /^(!|\/)(g(oogle)?)?calendar$/i
    public payloadAction = null;
    public requireServices: AppServiceName[] = ['google'];

    async handler(params: CmdHandlerParams) {
        const callback: GoogleCalendarCallback = this.app.getService('bot').getCallbackById('google');

        return callback._menu(params);
    }
}