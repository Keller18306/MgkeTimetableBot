import { DbChat } from './abstract/chat';
import { AbstractCommandContext } from './abstract/command';
import { KeyboardBuilder, KeyboardColor } from './abstract/keyboardBuilder';

export class Keyboard {
    private context?: AbstractCommandContext;
    private chat: DbChat;

    constructor(context: AbstractCommandContext | undefined, chat: DbChat) {
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
            let newRow: boolean = false;

            if (this.chat.showDaily) {
                newRow = true;
                keyboard.add({
                    text: '📄 На день',
                    color: KeyboardColor.PRIMARY_COLOR
                })
            }

            if (this.chat.showWeekly) {
                newRow = true;
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

    public get Settings() {
        const keyboard: KeyboardBuilder = new KeyboardBuilder('Settings');

        function noYesSmile(value: number | boolean, text: string, smiles: [string, string] = ['✅', '🚫']): string {
            return (value ? smiles[0] : smiles[1]) + ` ${text}`
        }

        function noYesColor(value: number | boolean) {
            return value ? KeyboardColor.POSITIVE_COLOR : KeyboardColor.NEGATIVE_COLOR
        }

        return keyboard.add({
            text: '📚 Первоначальная настройка',
            color: KeyboardColor.PRIMARY_COLOR
        }).row().add({
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
            text: noYesSmile(this.chat.removePastDays, 'Удалять прошедшие дни'),
            color: noYesColor(this.chat.removePastDays)
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