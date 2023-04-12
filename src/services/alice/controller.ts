import { IContext } from '@keller18306/yandex-dialogs-sdk';
import { readdirSync } from 'fs';
import path from 'path';
import { AliceSkill } from "./skill";

export class SkillController {
    private skills: {
        [id: string]: AliceSkill
    } = {};

    constructor() {
        this.loadSkills()
    }

    private loadSkills() {
        const cmdsPath = path.join(__dirname, 'skills')

        const dir = readdirSync(cmdsPath)

        for (const file of dir) {
            const { default: skillClass } = require(path.join(cmdsPath, file))

            if (skillClass == undefined) continue;

            const skill: AliceSkill = new skillClass();

            if (skill.id == undefined) continue;

            if (Object.keys(this.skills).includes(skill.id)) throw new Error(`skill id '${skill.id}' is already registred`);

            this.skills[skill.id] = skill;
        }

        console.log(`[Alice] Loaded ${Object.keys(this.skills).length} skills`)

        return this.skills
    }

    public matchSkill(ctx: IContext): { skill: AliceSkill, match: any } | false {
        for (const id in this.skills) {
            const skill: AliceSkill = this.skills[id];

            const match = skill.matcher(ctx);
            if (match !== false && match != null) {
                return { skill, match };
            }
        }

        return false;
    }
}