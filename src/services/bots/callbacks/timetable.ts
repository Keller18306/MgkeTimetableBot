import { AbstractCallback, CbHandlerParams } from "../abstract";

export default class extends AbstractCallback {
    public action: string = 'timetable';

    handler({ context }: CbHandlerParams) {
        //TODO page timetable viewer
        return context.answer('test')
    }
}