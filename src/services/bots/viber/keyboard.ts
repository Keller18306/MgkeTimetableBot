import { Keyboard, KeyboardButton } from 'viber-bot';
import { ButtonType, KeyboardBuilder, KeyboardColor } from '../abstract';
import { KeyboardBuilder as ViberKeyboardBuilder } from './keyboardBuilder';

function convertColor(keyboard: ViberKeyboardBuilder, color?: KeyboardColor): string {
    switch (color) {
        case KeyboardColor.PRIMARY_COLOR:
            return keyboard.PRIMARY_COLOR;
        case KeyboardColor.SECONDARY_COLOR:
            return keyboard.SECONDARY_COLOR;
        case KeyboardColor.POSITIVE_COLOR:
            return keyboard.POSITIVE_COLOR;
        case KeyboardColor.NEGATIVE_COLOR:
            return keyboard.NEGATIVE_COLOR;
        default:
            return keyboard.PRIMARY_COLOR;
    }
}

export function convertAbstractToViber(aKeyboard?: KeyboardBuilder): Keyboard | undefined {
    if (!aKeyboard || aKeyboard.isInline) {
        return;
    }

    const keyboard: ViberKeyboardBuilder = new ViberKeyboardBuilder(false);

    for (const row of aKeyboard.buttons) {
        for (const button of row) {
            let data: KeyboardButton;

            if (button.type === ButtonType.Url) {
                data = {
                    ActionType: 'open-url',
                    ActionBody: button.url,
                    Text: button.text
                }
            } else if (button.payload) {
                data = {
                    ActionType: 'reply',
                    ActionBody: 'payload:' + JSON.stringify(button.payload),
                    Text: button.text
                }
            } else {
                data = {
                    ActionType: 'reply',
                    ActionBody: button.text
                }
            }

            data.BgColor = convertColor(keyboard, button.color);

            keyboard.add(data);
        }

        keyboard.row()
    }

    return keyboard.build()
}
