import { KeyboardColor } from '../abstract';

export function noYesSmile(value: number | boolean, text: string, smiles: [string, string] = ['✅', '🚫']): string {
    return (value ? smiles[0] : smiles[1]) + ` ${text}`
}

export function noYesColor(value: number | boolean) {
    return value ? KeyboardColor.POSITIVE_COLOR : KeyboardColor.NEGATIVE_COLOR
}