import { BotServiceName, ButtonType, KeyboardBuilder, KeyboardColor } from '../abstract';

interface WeekTimetableOptions {
    type: 'group' | 'teacher';
    value: string | number;
    weekIndex?: number | null;
    label?: string;
    showHeader?: boolean;
}

export class StaticKeyboard {
    public static NeedAccept(service: BotServiceName) {
        if (service !== 'vk') return;

        return new KeyboardBuilder('NeedAccept', true)
            .add({
                text: 'Проверить',
                color: KeyboardColor.POSITIVE_COLOR
            })
    }

    // public static get DisableChanges() {
    //     return new KeyboardBuilder('DisableChanges', true)
    //         .add({
    //             text: 'Не оповещать об изменениях',
    //             color: KeyboardColor.PRIMARY_COLOR,
    //             payload: {
    //                 action: 'disableNoticeChanges'
    //             }
    //         })
    // }

    // public static get UnsubscribeMessages() {
    //     return new KeyboardBuilder('UnsubscribeMessages', true)
    //         .add({
    //             text: 'Отписаться от рассылки',
    //             color: KeyboardColor.PRIMARY_COLOR,
    //             payload: {
    //                 action: 'unsubscribeMessages'
    //             }
    //         })
    // }

    public static get StartButton(): KeyboardBuilder {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('StartButton');

        return keyboard.add({
            text: 'Начать',
            color: KeyboardColor.PRIMARY_COLOR
        });
    }

    public static get SelectMode(): KeyboardBuilder {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('SelectMode');

        return keyboard.add({
            text: '👀 Гость',
            color: KeyboardColor.PRIMARY_COLOR
        }).row().add({
            text: '👩‍🎓 Учащийся',
            color: KeyboardColor.PRIMARY_COLOR
        }).add({
            text: '👩‍🏫 Преподаватель',
            color: KeyboardColor.PRIMARY_COLOR
        }).row().add({
            text: '👨‍👩‍👦 Родитель',
            color: KeyboardColor.PRIMARY_COLOR
        }).add({
            text: '🔙 Пропустить',
            color: KeyboardColor.SECONDARY_COLOR
        });
    }

    public static get Cancel(): KeyboardBuilder {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('Cancel');

        return keyboard.add({
            payload: 'cancel',
            text: 'Отмена',
            color: KeyboardColor.NEGATIVE_COLOR
        });
    }

    public static GetWeekTimetable({ type, value, weekIndex, label, showHeader = true }: WeekTimetableOptions): KeyboardBuilder | undefined {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('GenerateImage', true);

        if (!isNaN(+value)) {
            value = Number(value)
        }

        if (type === 'group' || type === 'teacher') {
            type = type[0] as any; //first letter of type
        }

        return keyboard.add({
            type: ButtonType.Callback,
            text: label ?? 'На неделю',
            payload: 'timetable' + JSON.stringify([
                type, value, weekIndex ?? null, 0, showHeader ? 1 : 0
            ]),
            color: KeyboardColor.PRIMARY_COLOR
        });
    }
}