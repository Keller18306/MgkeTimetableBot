import { Op } from "sequelize";
import { z } from "zod";
import { AppServiceName } from "../../../app";
import { CalendarItem } from "../../google/models/calendar";
import { GoogleUser } from "../../google/models/user";
import { AbstractCallback, ButtonType, CbHandlerParams, CmdHandlerParams, KeyboardBuilder } from "../abstract";

const payloadAction = 'gcal';

enum GoogleMenu {
    MainMenu = 0,
    CalendarsList = 1,
    AddCalendar = 2,
    DeleteCalendar = 3
}

class GoogleKeyboard {
    public static Auth(url: string) {
        return new KeyboardBuilder('GoogleAuth', true).add({
            type: ButtonType.Url,
            text: 'Привязать Google аккаунт',
            url: url
        });
    }

    public static get Menu() {
        return new KeyboardBuilder('GoogleMenu', true).add({
            type: ButtonType.Callback,
            text: 'Список',
            payload: payloadAction + JSON.stringify([GoogleMenu.CalendarsList])
        }).add({
            type: ButtonType.Callback,
            text: 'Добавить',
            payload: payloadAction + JSON.stringify([GoogleMenu.AddCalendar])
        });
    }

    public static List(showDelete: boolean) {
        const keyboard = new KeyboardBuilder('GoogleCalendarsList', true);

        keyboard.add({
            type: ButtonType.Callback,
            text: 'Обновить',
            payload: payloadAction + JSON.stringify([GoogleMenu.CalendarsList])
        }).row();

        if (showDelete) {
            keyboard.add({
                type: ButtonType.Callback,
                text: 'Удалить',
                payload: payloadAction + JSON.stringify([GoogleMenu.DeleteCalendar])
            }).row();
        }

        return keyboard.add({
            type: ButtonType.Callback,
            text: 'Назад',
            payload: payloadAction + JSON.stringify([GoogleMenu.MainMenu])
        });
    }

    public static get Back() {
        return new KeyboardBuilder('GoogleCalendarsBack', true).add({
            type: ButtonType.Callback,
            text: 'Назад',
            payload: payloadAction + JSON.stringify([GoogleMenu.MainMenu])
        });
    }
}

export default class GoogleCalendarCallback extends AbstractCallback {
    public payloadAction: string = payloadAction;
    public requireServices: AppServiceName[] = ['google'];

    async handler(params: CbHandlerParams) {
        const { context, chat } = params;

        if (!chat.googleEmail) {
            return this._auth(params);
        }

        const [menu] = z.tuple([
            z.nativeEnum(GoogleMenu)
        ]).parse(context.payload);

        const google = this.app.getService('google');
        const user = await google.getByEmail(chat.googleEmail);

        //recheck account
        await user.getApi().getAuth().getAccessToken();

        switch (menu) {
            case GoogleMenu.MainMenu:
                return this._menu(params);
            case GoogleMenu.AddCalendar:
                return this._add(params, user);
            case GoogleMenu.CalendarsList:
                return this._list(params, user);
        }
    }

    private _auth({ context, service }: CbHandlerParams) {
        const google = this.app.getService('google');

        const url = google.getAuthUrl({
            service: service,
            peerId: context.peerId
        });

        return context.editOrSend('Гугл аккаунт не привязан, чтобы привязать, нажмите на кнопку ниже', {
            keyboard: GoogleKeyboard.Auth(url)
        });
    }

    public _menu({ context, chat }: CbHandlerParams | CmdHandlerParams) {
        return context.editOrSend([
            `Привязанный гугл аккаунт: ${chat.googleEmail}.`,
            'Действие с календарями:'
        ].join('\n'), {
            keyboard: GoogleKeyboard.Menu
        });
    }

    private async _list({ context }: CbHandlerParams, user: GoogleUser) {
        const api = user.getApi().calendar;

        const dayIndex = await this.app.getService('timetable').getDayIndexBounds();

        const calendars = (await api.getList()).filter((calendarId) => {
            return calendarId.split('@', 1)[0].length === 64;
        });

        const timetableCalendars = await CalendarItem.findAll({
            where: {
                calendarId: {
                    [Op.in]: calendars
                }
            }
        });

        const list = timetableCalendars.map((calendar, i) => {
            let syncText: string | undefined;

            if (calendar.lastManualSyncedDay) {
                const current = Math.max(0, calendar.lastManualSyncedDay! - dayIndex.min);
                const max = (dayIndex.max - dayIndex.min);

                const progress = current * 100 / max;

                syncText = ` (Синхронизация: ${progress.toFixed(2)}%)`;
            }
            
            return `${i + 1}. ${calendar.type}, ${calendar.value}` +
                (syncText ? syncText : '');
        });

        return context.editOrSend(list.length > 0 ? [
            'Список календарей с расписанием:',
            list.join('\n')
        ].join('\n') : 'Нет добавленных календарей', {
            keyboard: GoogleKeyboard.List(list.length > 0)
        });
    }

    private async _add({ context, chat }: CbHandlerParams, user: GoogleUser) {
        const google = this.app.getService('google');

        let result: [CalendarItem, boolean];

        switch (chat.mode) {
            case 'parent':
            case 'student':
                if (!chat.group) {
                    return context.answer('Вы ещё не выбрали группу');
                }

                result = await CalendarItem.getOrCreateCalendar('group', chat.group);
                break;

            case 'teacher':
                if (!chat.teacher) {
                    return context.answer('Вы ещё не выбрали преподавателя');
                }

                result = await CalendarItem.getOrCreateCalendar('teacher', chat.teacher);
                break;

            default:
                return context.answer('Режим чата не позволяет добавить календарь');
        }

        const [calendar, created] = result;

        if (created) {
            google.calendarController.resync(calendar).catch((err) => {
                console.error('bot creation sync error', calendar.calendarId, err);
                context.send('Ошибка синхронизации календаря. Сообщите разработчику!').catch(() => { });
            });
        }

        await user.getApi().calendar.addById(calendar.calendarId);

        return context.editOrSend('Календарь успешно добавлен в ваш гугл аккаунт!' +
            (created ? '\n\nВажно! Так как календарь был создан только что, необходимо время для его полной синхронизации.' : ''), {
            keyboard: GoogleKeyboard.Back
        });
    }
}