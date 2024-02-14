export enum KeyboardColor {
    PRIMARY_COLOR,
    SECONDARY_COLOR,
    POSITIVE_COLOR,
    NEGATIVE_COLOR
}

export type KeyboardButton = {
    type?: ButtonType,
    text: string,
    payload?: any,
    color?: KeyboardColor
} & ({
    type?: ButtonType.Text | ButtonType.Callback,
} | {
    type: ButtonType.Url,
    url: string
})

export enum ButtonType {
    Text,
    Callback,
    Url
}

export class KeyboardBuilder {
    public readonly name: string;

    public buttons: KeyboardButton[][] = [];

    public isInline: boolean;
    public withCancelButton: boolean = false;

    constructor(keyboardName: string, inline?: boolean) {
        this.name = keyboardName;
        this.isInline = inline || false;
    }

    public add(button: KeyboardButton) {
        if (!button.type) {
            button.type = ButtonType.Text
        }

        let index = this.buttons.length - 1;

        if (index == -1) {
            index++
            this.buttons[index] = [];
        }

        this.buttons[index].push(button);

        return this
    }

    public row() {
        this.buttons.push([]);
        return this
    }

    public inline(value: boolean) {
        this.isInline = value;
        return this;
    }
}