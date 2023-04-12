import { InlineKeyboardBuilder, KeyboardBuilder as TgKeyboardBuilder } from 'puregram';
import { KeyboardBuilder } from '../abstract/keyboardBuilder';

export function convertAbstractToTg(aKeyboard?: KeyboardBuilder): TgKeyboardBuilder | InlineKeyboardBuilder | undefined {
    if (!aKeyboard) {
        return;
    }

    let keyboard: InlineKeyboardBuilder | TgKeyboardBuilder;
    if (aKeyboard.isInline) {
        keyboard = new InlineKeyboardBuilder();

        for (const row of aKeyboard.buttons) {
            for (const button of row) {
                keyboard.textButton({
                    text: button.text,
                    payload: button.payload
                });
            }

            keyboard.row()
        }
    } else {
        keyboard = new TgKeyboardBuilder();

        keyboard.resize(true);

        for (const row of aKeyboard.buttons) {
            for (const button of row) {
                keyboard.textButton(button.text);
            }

            keyboard.row()
        }
    }

    return keyboard
}
