import { Keyboard, KeyboardButton } from "viber-bot";

export type Theme = 'white' | 'dark' | 'black'

export class KeyboardBuilder {
    public PRIMARY_COLOR: string = '#8875f0';
    public SECONDARY_COLOR: string;
    public POSITIVE_COLOR: string = '#50de55';
    public NEGATIVE_COLOR: string = '#de5050';
    public DEFAULT_COLOR: string;

    private defaultHeight: boolean;
    private bgColor: string;

    private buttons: KeyboardButton[][] = [];

    constructor(defaultHeight: boolean = false, theme: Theme = 'white') {
        this.defaultHeight = defaultHeight;
        
        switch (theme) {
            case 'white': {
                this.DEFAULT_COLOR = '#ffffff';
                this.SECONDARY_COLOR = '#efefef';
                break;
            }
                
            case 'dark': {
                this.DEFAULT_COLOR = '#1d2733';
                this.SECONDARY_COLOR = '#2b4463';
                break;
            }
                
            case 'black': { 
                this.DEFAULT_COLOR = '#000000';
                this.SECONDARY_COLOR = '#3b3b3b';
                break;
            }
            
            default:
                throw new Error('Unknown theme')
        }

        this.bgColor = this.DEFAULT_COLOR;
    }

    public add(button: KeyboardButton) {
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

    private buildButtons(): KeyboardButton[] {
        const buttons: KeyboardButton[] = [];

        for (const row of this.buttons) {
            if (row.length === 0) continue;

            for (const button of row) {
                if (button.Rows == null) {
                    button.Rows = 1;
                }

                if (button.Columns == null) {
                    button.Columns = Math.round(6 / row.length);
                }

                if (button.Text == null) {
                    button.Text = button.ActionBody;
                }
            }

            buttons.push(...row);
        }

        return buttons
    }

    public build(): Keyboard {
        return {
            Type: 'keyboard',
            DefaultHeight: this.defaultHeight,
            BgColor: this.bgColor,
            Buttons: this.buildButtons()
        }
    }
}