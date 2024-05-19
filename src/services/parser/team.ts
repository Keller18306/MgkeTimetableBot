import { AbstractParser } from "./abstract";
import { Team } from "./types";

export default class TeamParser extends AbstractParser {
    protected team: Team = {}

    public run(team?: Team): Team {
        if (team) {
            this.team = team;
        }

        const items: HTMLDivElement[] = Array.from(this.document.querySelectorAll('.main.container #main-p > div.item'));
        for (const item of items) {
            this.parseItem(item);
        }

        return this.team;
    }

    private parseItem(item: HTMLDivElement) {
        // const img: HTMLImageElement | null = item.querySelector('div.preview > img');

        const content: HTMLDivElement | null = item.querySelector('.content');
        if (!content) {
            throw new Error('Нет блока данных об учителе');
        }

        const fullName = content.querySelector('h3')?.textContent;
        if (!fullName) {
            throw new Error('Невозможно получить полное имя учителя');
        }

        const shortName = fullName.match(/(\W+)\s(\W)\W+\s(\W)\W+/i)?.slice(1, 4).map((part, i) => {
            if (i === 0) return part;

            return part + '.';
        }).join(' ');

        if (!shortName) {
            throw new Error('Невозможно преобразовать полное имя в сокращённое');
        }
        // const job = content.querySelector('li.tss')?.textContent?.match(/\:\s?(.+)/i)?.[1];
        // const description = content.querySelector('li:not(.tss)')?.textContent;

        this.team[shortName] = fullName;
    }
}
