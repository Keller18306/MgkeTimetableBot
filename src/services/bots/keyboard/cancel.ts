import { ButtonType, KeyboardBuilder, KeyboardColor } from '../abstract';

export function withCancelButton(keyboard: KeyboardBuilder) {
    keyboard.withCancelButton = true;

    keyboard.row().add({
        type: ButtonType.Callback,
        text: 'Отмена',
        payload: 'cancel',
        color: KeyboardColor.NEGATIVE_COLOR
    });

    return keyboard;
}