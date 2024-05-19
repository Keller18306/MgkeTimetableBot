import { config } from "../../../../config";
import { StringDate, sort } from "../../../utils";
import { raspCache } from "../../parser";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class VkAppAuthMethod extends VKAppDefaultMethod {

    public httpMethod: "GET" | "POST" = 'GET';
    public method: string = 'auth';

    async handler({ user, request }: HandlerParams) {
        if (user.ref === null) {
            let ref = 'none'
            if (typeof request.query.ref === 'string') {
                ref = request.query.ref.slice(0, 255)
            }

            await user.update({ ref: ref });
        }

        return {
            rasp: {
                student: {
                    days: user.group != null ? (raspCache.groups.timetable[user.group]?.days.map(day => {
                        return Object.assign({}, {
                            weekday: StringDate.fromStringDate(day.day).getWeekdayName()
                        }, day);
                    }) || []) : [],
                    update: raspCache.groups.update
                },
                teacher: {
                    days: user.teacher != null ? (raspCache.teachers.timetable[user.teacher]?.days.map(day => {
                        return Object.assign({}, {
                            weekday: StringDate.fromStringDate(day.day).getWeekdayName()
                        }, day);
                    }) || []) : [],
                    update: raspCache.teachers.update
                },
                lastSuccess: raspCache.successUpdate
            },
            selected: {
                group: user.group,
                teacher: user.teacher,
            },
            groups: sort(Object.keys(raspCache.groups.timetable)),
            teachers: sort(Object.keys(raspCache.teachers.timetable)),
            config: {
                themeId: user.themeId,
                canActivateBot: false,
                adblock: Boolean(user.adblock) || config.globalAdblock,
                firstPage: user.firstPage
            }
        }
    }
}