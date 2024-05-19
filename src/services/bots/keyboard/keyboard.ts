import { App } from '../../../app';
import { SCHEDULE_FORMATTERS } from '../../../formatter';
import { WeekIndex } from '../../../utils';
import { AbstractContext, ButtonType, KeyboardBuilder, KeyboardColor } from '../abstract';
import { BotChat } from '../chat';
import { noYesColor, noYesSmile } from './utils';

export class Keyboard {
    constructor(
        private app: App,
        private chat: BotChat,
        private context?: AbstractContext
    ) { }

    public getKeyboardBuilder(keyboardName: string, inline?: boolean): KeyboardBuilder {
        return new KeyboardBuilder(keyboardName, inline);
    }

    public get MainMenu(): KeyboardBuilder {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('MainMenu');

        ///___ 1 LEVEL ___///
        if (this.chat.mode === null) {
            if (!this.context?.isChat) keyboard.add({
                text: '📚 Первоначальная настройка',
                color: KeyboardColor.PRIMARY_COLOR
            }).row()
        } else if (this.chat.mode === 'guest') {
            keyboard.add({
                text: '👩‍🎓 Группа',
                color: KeyboardColor.PRIMARY_COLOR
            }).add({
                text: '👩‍🏫 Преподаватель',
                color: KeyboardColor.PRIMARY_COLOR
            }).row()
        } else {
            if (this.chat.showDaily) {
                keyboard.add({
                    text: '📄 На день',
                    color: KeyboardColor.PRIMARY_COLOR
                })
            }

            if (this.chat.showWeekly) {
                keyboard.add({
                    text: '📑 На неделю',
                    color: KeyboardColor.PRIMARY_COLOR
                })
            }

            if (this.chat.showDaily || this.chat.showWeekly) keyboard.row()
        }

        const showFastAnother: boolean = this.chat.mode ? ['student', 'parent', 'teacher'].includes(this.chat.mode) : false;

        ///___ 2 LEVEL ___///
        if (showFastAnother && this.chat.showFastGroup) {
            keyboard.add({
                text: '👩‍🎓 Группа',
                color: KeyboardColor.PRIMARY_COLOR
            })
        }

        if (this.chat.showAbout && this.chat.showCalls) keyboard.add({
            text: '🕐 Звонки',
            color: KeyboardColor.SECONDARY_COLOR
        })

        if (showFastAnother && this.chat.showFastTeacher) {
            keyboard.add({
                text: ((this.chat.showAbout && this.chat.showCalls) && (showFastAnother && this.chat.showFastGroup)) ? '👩‍🏫 Препод.' : '👩‍🏫 Преподаватель',
                color: KeyboardColor.PRIMARY_COLOR
            })
        }


        ///___ 3 LEVEL ___///
        keyboard.row()
        if (!this.chat.showAbout && this.chat.showCalls) keyboard.add({
            text: '🕐 Звонки',
            color: KeyboardColor.SECONDARY_COLOR
        })
        keyboard.add({
            text: '⚙️ Настройки',
            color: KeyboardColor.SECONDARY_COLOR
        })
        if (this.chat.showAbout) keyboard.add({
            text: '💡 О боте',
            color: KeyboardColor.SECONDARY_COLOR
        })

        return keyboard
    }

    public get SettingsMain() {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('SettingsMain');

        return keyboard.add({
            text: '📚 Первоначальная настройка',
            color: KeyboardColor.PRIMARY_COLOR
        }).row().add({
            text: '⌨️ Кнопки'
        }).add({
            text: '📃 Форматировщик'
        }).row().add({
            text: '🔊 Оповещения'
        }).add({
            text: '🖼️ Отображение'
        }).row().add({
            text: 'Показать текущие',
            color: KeyboardColor.PRIMARY_COLOR
        }).add({
            text: 'Главное меню',
            color: KeyboardColor.SECONDARY_COLOR
        })
    }

    public get SettingsButtons() {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('SettingsButtons');

        return keyboard.add({
            text: noYesSmile(this.chat.showDaily, 'Кнопка "📄 На день"'),
            color: noYesColor(this.chat.showDaily)
        }).add({
            text: noYesSmile(this.chat.showWeekly, 'Кнопка "📑 На неделю"'),
            color: noYesColor(this.chat.showWeekly)
        }).row().add({
            text: noYesSmile(this.chat.showCalls, 'Кнопка "🕐 Звонки"'),
            color: noYesColor(this.chat.showCalls)
        }).add({
            text: noYesSmile(this.chat.showAbout, 'Кнопка "💡 О боте"'),
            color: noYesColor(this.chat.showAbout)
        }).row().add({
            text: noYesSmile(this.chat.showFastGroup, 'Кнопка "👩‍🎓 Группа"'),
            color: noYesColor(this.chat.showFastGroup)
        }).add({
            text: noYesSmile(this.chat.showFastTeacher, 'Кнопка "👩‍🏫 Преподаватель"'),
            color: noYesColor(this.chat.showFastTeacher)
        }).row().add({
            text: 'Меню настроек',
            color: KeyboardColor.SECONDARY_COLOR
        }).add({
            text: 'Главное меню',
            color: KeyboardColor.SECONDARY_COLOR
        })
    }

    public get SettingsNotice() {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('SettingsNotice');

        return keyboard.add({
            text: noYesSmile(this.chat.noticeChanges, 'Оповещение о новых днях: ', ['🔈', '🔇']) + (this.chat.noticeChanges ? 'Да' : 'Нет'),
            color: noYesColor(this.chat.noticeChanges)
        }).row().add({
            text: noYesSmile(this.chat.noticeNextWeek, 'Оповещение о новой неделе: ', ['🔈', '🔇']) + (this.chat.noticeNextWeek ? 'Да' : 'Нет'),
            color: noYesColor(this.chat.noticeNextWeek)
        }).row().add({
            text: 'Меню настроек',
            color: KeyboardColor.SECONDARY_COLOR
        }).add({
            text: 'Главное меню',
            color: KeyboardColor.SECONDARY_COLOR
        })
    }

    public get SettingsView() {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('SettingsView');

        return keyboard.add({
            text: noYesSmile(this.chat.hidePastDays, 'Скрывать прошедшие дни'),
            color: noYesColor(this.chat.hidePastDays)
        }).row().add({
            text: noYesSmile(this.chat.showParserTime, 'Время последней загрузки расписания'),
            color: noYesColor(this.chat.showParserTime)
        }).row().add({
            text: noYesSmile(this.chat.showHints, 'Показывать подсказки: ') + (this.chat.showHints ? 'Да' : 'Нет'),
            color: noYesColor(this.chat.showHints),
        }).row().add({
            text: 'Меню настроек',
            color: KeyboardColor.SECONDARY_COLOR
        }).add({
            text: 'Главное меню',
            color: KeyboardColor.SECONDARY_COLOR
        })
    }

    public get SettingsFormatters() {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('Settings');

        for (const i in SCHEDULE_FORMATTERS) {
            const Formatter = SCHEDULE_FORMATTERS[i];

            const selected: boolean = this.chat.scheduleFormatter === +i;

            keyboard.add({
                text: Formatter.label + (selected ? ' (выбран)' : ''),
                color: selected ? KeyboardColor.POSITIVE_COLOR : KeyboardColor.PRIMARY_COLOR
            });

            if (+i + 1 % 2 === 0) keyboard.row();
        }

        return keyboard.row().add({
            text: 'Меню настроек',
            color: KeyboardColor.SECONDARY_COLOR
        }).add({
            text: 'Главное меню',
            color: KeyboardColor.SECONDARY_COLOR
        })
    }

    public get SettingsAliases(): KeyboardBuilder {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('SettingsAliases');

        return keyboard.add({
            text: 'Список',
            color: KeyboardColor.PRIMARY_COLOR
        }).add({
            text: 'Добавить',
            color: KeyboardColor.PRIMARY_COLOR
        }).row().add({
            text: 'Удалить',
            color: KeyboardColor.PRIMARY_COLOR
        }).row().add({
            text: 'Отчистить все',
            color: KeyboardColor.PRIMARY_COLOR
        }).row().add({
            text: 'Меню настроек',
            color: KeyboardColor.SECONDARY_COLOR
        }).add({
            text: 'Главное меню',
            color: KeyboardColor.SECONDARY_COLOR
        });
    }

    public get GroupHistory() {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('GroupHistory', true);

        for (const group of this.chat.historyGroup) {
            keyboard.add({
                type: ButtonType.Callback,
                text: group,
                payload: 'answer' + JSON.stringify({
                    answer: group
                })
            });
        }

        return keyboard;
    }

    public get TeacherHistory() {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('TeacherHistory', true);

        for (const teacher of this.chat.historyTeacher) {
            keyboard.add({
                type: ButtonType.Callback,
                text: teacher,
                payload: 'answer' + JSON.stringify({
                    answer: teacher
                })
            })
        }

        return keyboard;
    }

    public generateVerticalKeyboard(values: string[]) {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('WithVerticalValues', true);

        for (const value of values) {
            keyboard.add({
                type: ButtonType.Callback,
                text: value,
                payload: 'answer' + JSON.stringify({
                    answer: value
                })
            }).row()
        }

        return keyboard;
    }

    public async WeekControl(type: string, value: string | number, weekIndex: number, hidePastDays: boolean = true, showHeader: boolean = false): Promise<KeyboardBuilder | undefined> {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('WeekControl', true);

        if (!isNaN(+value)) {
            value = Number(value)
        }

        if (type === 'group' || type === 'teacher') {
            type = type[0]; //first letter of type
        }

        const { min, max } = await this.app.getService('timetable').getWeekIndexBounds();

        let newLine: boolean = false;

        if (weekIndex - 1 >= min) {
            keyboard.add({
                type: ButtonType.Callback,
                text: '⬅️',
                payload: 'timetable' + JSON.stringify([
                    type, value, (weekIndex - 1), Number(hidePastDays), Number(showHeader)
                ]),
                color: KeyboardColor.PRIMARY_COLOR
            });

            newLine = true;
        }

        //show full
        if (hidePastDays && weekIndex === WeekIndex.now().valueOf()) {
            keyboard.add({
                type: ButtonType.Callback,
                text: '🔼',
                payload: 'timetable' + JSON.stringify([
                    type, value, weekIndex, 0, Number(showHeader)
                ]),
                color: KeyboardColor.PRIMARY_COLOR
            });

            newLine = true;
        }

        if (weekIndex + 1 <= max) {
            keyboard.add({
                type: ButtonType.Callback,
                text: '➡️',
                payload: 'timetable' + JSON.stringify([
                    type, value, (weekIndex + 1), Number(hidePastDays), Number(showHeader)
                ]),
                color: KeyboardColor.PRIMARY_COLOR
            });

            newLine = true;
        }

        if (newLine) {
            keyboard.row();
        }

        keyboard.add({
            type: ButtonType.Callback,
            text: '📷 Сгенерировать изображение',
            payload: 'image' + JSON.stringify([
                type, value, weekIndex
            ]),
            color: KeyboardColor.PRIMARY_COLOR
        });

        return keyboard;
    }

    public GetWeekTimetable(type: string, value: string | number): KeyboardBuilder | undefined {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('GenerateImage', true);

        if (!isNaN(+value)) {
            value = Number(value)
        }

        if (type === 'group' || type === 'teacher') {
            type = type[0]; //first letter of type
        }

        return keyboard.add({
            type: ButtonType.Callback,
            text: 'На неделю',
            payload: 'timetable' + JSON.stringify([
                type, value, null, 0, 1
            ]),
            color: KeyboardColor.PRIMARY_COLOR
        });
    }
}