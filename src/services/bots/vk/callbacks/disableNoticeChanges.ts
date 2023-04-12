import { DefaultCallback, HandlerParams } from './_default';

export default class extends DefaultCallback {
    public id = 'disableNoticeChanges';

    public action = 'disableNoticeChanges';

    async handler({ context, chat }: HandlerParams) {
        
    }
}