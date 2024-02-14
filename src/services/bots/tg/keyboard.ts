import { InlineKeyboardBuilder as TgInlineKeyboardBuilder, KeyboardBuilder as TgKeyboardBuilder } from 'puregram';
import { ButtonType, KeyboardBuilder } from '../abstract';

export function convertAbstractToTg(aKeyboard?: KeyboardBuilder): TgKeyboardBuilder | TgInlineKeyboardBuilder | undefined {
    if (!aKeyboard) {
        return;
    }

    let keyboard: TgInlineKeyboardBuilder | TgKeyboardBuilder;
    if (aKeyboard.isInline) {
        keyboard = new TgInlineKeyboardBuilder();

        for (const row of aKeyboard.buttons) {
            for (const button of row) {
                if (button.type === ButtonType.Url) {
                    keyboard.urlButton({
                        text: button.text,
                        url: button.url,
                        payload: button.payload
                    });
                } else {
                    keyboard.textButton({
                        text: button.text,
                        payload: button.payload
                    });
                }
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
