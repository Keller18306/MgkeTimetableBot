import { ButtonColor, Keyboard, KeyboardBuilder as VKKeyboardBuilder } from 'vk-io';
import { ButtonType, KeyboardBuilder, KeyboardColor } from '../abstract';

function convertColor(color: KeyboardColor | undefined): ButtonColor {
    switch (color) {
        case KeyboardColor.PRIMARY_COLOR:
            return Keyboard.PRIMARY_COLOR;
        case KeyboardColor.SECONDARY_COLOR:
            return Keyboard.SECONDARY_COLOR;
        case KeyboardColor.POSITIVE_COLOR:
            return Keyboard.POSITIVE_COLOR;
        case KeyboardColor.NEGATIVE_COLOR:
            return Keyboard.NEGATIVE_COLOR;
        default:
            return Keyboard.PRIMARY_COLOR;
    }
}

export function convertAbstractToVK(aKeyboard?: KeyboardBuilder): VKKeyboardBuilder | undefined {
    if (!aKeyboard) {
        return;
    }

    const keyboard: VKKeyboardBuilder = new VKKeyboardBuilder();
    keyboard.oneTime(false);

    if (aKeyboard.isInline) {
        keyboard.inline(true);
    }

    for (const row of aKeyboard.buttons) {
        for (const button of row) {
            if (button.type === ButtonType.Text || !button.type) {
                keyboard.textButton({
                    label: button.text,
                    color: convertColor(button.color),
                    payload: button.payload
                });
            } else if (button.type === ButtonType.Callback) {
                keyboard.callbackButton({
                    label: button.text,
                    color: convertColor(button.color),
                    payload: button.payload
                });
            } else if (button.type === ButtonType.Url) {
                keyboard.urlButton({
                    label: button.text,
                    url: button.url,
                    payload: button.payload
                })
            }
        }

        keyboard.row();
    }

    return keyboard;
}