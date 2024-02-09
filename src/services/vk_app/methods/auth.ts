import { config } from "../../../../config";
import db from "../../../db";
import { raspCache } from "../../parser";
import { StringDate, sort } from "../../../utils";
import VKAppDefaultMethod, { HandlerParams } from "./_default";

export default class VkAppAuthMethod extends VKAppDefaultMethod {

    public httpMethod: "GET" | "POST" = 'GET';
    public method: string = 'auth';

    handler({ user, request, response }: HandlerParams) {
        const cfg = user.get()

        if (cfg.ref === null) {
            let ref = 'none'
            if (typeof request.query.ref === 'string') {
                ref = request.query.ref.slice(0, 255)
            }

            db.prepare('UPDATE `vk_app_users` SET `ref` = ? WHERE `user_id` = ?').run(ref, user.vk_id)
        }

        return {
            rasp: {
                student: {
                    days: cfg.group != null ? (raspCache.groups.timetable[cfg.group]?.days.map(day => {
                        return Object.assign({}, {
                            weekday: StringDate.fromStringDate(day.day).getWeekdayName()
                        }, day);
                    }) || []) : [],
                    update: raspCache.groups.update
                },
                teacher: {
                    days: cfg.teacher != null ? (raspCache.teachers.timetable[cfg.teacher]?.days.map(day => {
                        return Object.assign({}, {
                            weekday: StringDate.fromStringDate(day.day).getWeekdayName()
                        }, day);
                    }) || []) : [],
                    update: raspCache.teachers.update
                },
                lastSuccess: raspCache.successUpdate
            },
            selected: {
                group: cfg.group,
                teacher: cfg.teacher,
            },
            groups: sort(Object.keys(raspCache.groups.timetable)),
            teachers: sort(Object.keys(raspCache.teachers.timetable)),
            config: {
                themeId: cfg.theme_id,
                canActivateBot: user.allowBotAccept,
                adblock: Boolean(cfg.adblock) || config.globalAdblock,
                firstPage: cfg.firstPage
            }
        }
    }
}