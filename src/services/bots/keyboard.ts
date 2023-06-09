import { SCHEDULE_FORMATTERS } from '../../utils';
import { AbstractChat, AbstractCommandContext, KeyboardBuilder, KeyboardColor } from './abstract';

function noYesSmile(value: number | boolean, text: string, smiles: [string, string] = ['✅', '🚫']): string {
    return (value ? smiles[0] : smiles[1]) + ` ${text}`
}

function noYesColor(value: number | boolean) {
    return value ? KeyboardColor.POSITIVE_COLOR : KeyboardColor.NEGATIVE_COLOR
}

export class Keyboard {
    private context?: AbstractCommandContext;
    private chat: AbstractChat;

    constructor(context: AbstractCommandContext | undefined, chat: AbstractChat) {
        this.context = context;
        this.chat = chat;
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
        const keyboard: KeyboardBuilder = new KeyboardBuilder('Settings');
        
        return keyboard.add({
            text: '📚 Первоначальная настройка',
            color: KeyboardColor.PRIMARY_COLOR
        }).row().add({
            text: '⌨️ Настройка кнопок'
        }).row().add({
            text: '📃 Настройка форматировщика'
        }).row().add({
            text: noYesSmile(this.chat.hidePastDays, 'Скрывать прошедшие дни'),
            color: noYesColor(this.chat.hidePastDays)
        }).row().add({
            text: noYesSmile(this.chat.showParserTime, 'Время последней загрузки расписания'),
            color: noYesColor(this.chat.showParserTime)
        }).row().add({
            text: noYesSmile(this.chat.noticeChanges, 'Оповещение о новых днях: ', ['🔈', '🔇']) + (this.chat.noticeChanges ? 'Да' : 'Нет'),
            color: noYesColor(this.chat.noticeChanges)
        }).row().add({
            text: 'Показать текущие',
            color: KeyboardColor.PRIMARY_COLOR
        }).add({
            text: 'Меню',
            color: KeyboardColor.SECONDARY_COLOR
        })
    }

    public get SettingsButtons() {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('Settings');

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
            text: 'Меню',
            color: KeyboardColor.SECONDARY_COLOR
        })
    }

    public get SettingsFormatters() {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('Settings');

        for (const i in SCHEDULE_FORMATTERS) {
            const Formatter = SCHEDULE_FORMATTERS[i];

            const selected: boolean = this.chat.scheduleFormatter === +i;

            keyboard.add({
                text: Formatter.label+(selected ? ' (выбран)' : ''),
                color: selected ? KeyboardColor.POSITIVE_COLOR : KeyboardColor.PRIMARY_COLOR
            });

            if (+i + 1 % 2 === 0) keyboard.row();
        }

        return keyboard.row().add({
            text: 'Меню настроек',
            color: KeyboardColor.SECONDARY_COLOR
        }).add({
            text: 'Меню',
            color: KeyboardColor.SECONDARY_COLOR
        })
    }

    public get GroupHistory() {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('GroupHistory', true);

        for (const group of this.chat.groupSearchHistory) {
            keyboard.add({
                text: group,
                payload: {
                    action: 'answer',
                    answer: group
                }
            });
        }

        return keyboard;
    }

    public get TeacherHistory() {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('TeacherHistory', true);

        for (const teacher of this.chat.teacherSearchHistory) {
            keyboard.add({
                text: teacher,
                payload: {
                    action: 'answer',
                    answer: teacher
                }
            })
        }

        return keyboard;
    }

    public generateVerticalKeyboard(values: string[]) {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('WithVerticalValues', true);

        for (const value of values) {
            keyboard.add({
                text: value,
                payload: {
                    action: 'answer',
                    answer: value
                }
            }).row()
        }

        return keyboard;
    }

    public GenerateImage(type: string, value: string): KeyboardBuilder | undefined {
        if (this.chat.service !== 'tg') return;

        const keyboard: KeyboardBuilder = new KeyboardBuilder('GenerateImage', true);

        return keyboard.add({
            text: '📷 Сгенерировать изображение',
            payload: {
                action: 'image',
                type: type,
                value: value
            },
            color: KeyboardColor.PRIMARY_COLOR
        });
    }
}

export class StaticKeyboard {
    public static get NeedAccept() {
        return new KeyboardBuilder('NeedAccept', true)
            .add({
                text: 'Проверить',
                color: KeyboardColor.POSITIVE_COLOR
            })
    }

    public static get DisableChanges() {
        return new KeyboardBuilder('DisableChanges', true)
            .add({
                text: 'Не оповещать об изменениях',
                color: KeyboardColor.PRIMARY_COLOR,
                payload: {
                    action: 'disableNoticeChanges'
                }
            })
    }

    public static get UnsubscribeMessages() {
        return new KeyboardBuilder('UnsubscribeMessages', true)
            .add({
                text: 'Отписаться от рассылки',
                color: KeyboardColor.PRIMARY_COLOR,
                payload: {
                    action: 'unsubscribeMessages'
                }
            })
    }

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
            payload: {
                action: 'cancel'
            },
            text: 'Отмена',
            color: KeyboardColor.NEGATIVE_COLOR
        });
    }
}

export function withCancelButton(keyboard: KeyboardBuilder) {
    keyboard.withCancelButton = true;

    keyboard.row().add({
        text: 'Отмена',
        payload: 'cancel',
        color: KeyboardColor.NEGATIVE_COLOR
    });

    return keyboard;
}