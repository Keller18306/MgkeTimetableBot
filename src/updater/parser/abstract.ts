import { DOMWindow } from "jsdom";
import { GroupLesson, Groups } from "./types/group";
import { TeacherLesson, Teachers } from "./types/teacher";

export abstract class AbstractParser {
    protected readonly window: Window | DOMWindow;
    private _bodyTables?: HTMLTableElement[] = undefined;

    constructor(window: Window | DOMWindow) {
        this.window = window;
    }

    protected get document() {
        return this.window.document;
    }

    protected querySelectorAll(selector: string): NodeListOf<HTMLElement> {
        return this.document.querySelectorAll(selector)
    }

    protected querySelector(selector: string): HTMLElement | null {
        return this.document.querySelector(selector)
    }

    protected parseBodyTables(_forceCache: boolean = false) {
        if (_forceCache || this._bodyTables === undefined) {
            this._bodyTables = Array.from(
                this.document.querySelectorAll('body table') as NodeListOf<HTMLTableElement>
            )
        }

        return this._bodyTables
    }

    protected parseDayName(value: string): { day: string, weekday: string } {
        const parsed = value.match(/(.+),\s?(.+)/i)?.slice(1)
        if (!parsed) {
            throw new Error('could not parse day name')
        }

        return {
            day: parsed[1],
            weekday: parsed[0]
        }
    }

    protected clearElementText(text?: string | null): string | undefined {
        return text?.replaceAll('\n', '')
            .replaceAll('<br>', '')
            .replaceAll('&nbsp;', '')
            .replace(/\s+/g, ' ').trim();
    }

    protected removeDashes(text?: string | null): string | null {
        return text?.trim()
            .replaceAll(/^-((\s-)?)+$/ig, '')
            .trim() || null
    }

    protected setNullIfEmpty(text?: string | null): string | null {
        return (text === '' || text == undefined) ? null : text
    }

    protected parseGroupNumber(text: string | undefined): string | undefined {
        return text?.replace(/\*$/i, '')
    }

    protected clearEndingNull<T extends GroupLesson | TeacherLesson>(lessons: T[]): void {
        let toClear: number = 0;

        for (const lesson of lessons) {
            if (lesson === null) {
                toClear++
                continue;
            }

            toClear = 0
        }

        lessons.splice(lessons.length - toClear, toClear)
    }

    /**
     * @description Удаляет все пустые дни "Воскресенья"
     */
    protected clearSundays<T extends Groups | Teachers>(rasp: T): void {
        for (const key in rasp) {
            const { days } = rasp[key];

            const sundayIndex = days.findIndex((day): boolean => {
                return day.weekday.toLowerCase() === 'воскресенье';
            });
            if (sundayIndex === -1) continue;

            const sunday = days[sundayIndex];
            if (sunday.lessons.length > 0) continue;

            days.splice(sundayIndex, 1);
        }
    }

    abstract run(): object
}