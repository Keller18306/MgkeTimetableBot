import Table2canvas, { IColumn } from '@keller18306/table2canvas';
import { Canvas, CanvasRenderingContext2D, Image, loadImage } from "canvas";
import { createHash } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { config } from "../../../config";
import { Group, GroupDay, GroupLessonExplain, Teacher, TeacherDay } from "../../updater/parser/types";
import { formatDateTime, getWeekdayNameByStrDate } from "../../utils";

const groupColumns: IColumn[] = [
    {
        title: '№',
        dataIndex: 'i',
        width: 30
    },
    {
        title: 'Предмет',
        dataIndex: 'lesson',
        textAlign: 'left'
    },
    {
        title: 'Вид',
        dataIndex: 'type',
        width: 60
    },
    {
        title: 'Аудитория',
        dataIndex: 'cabinet',
        width: 100
    },
    {
        title: 'Преподаватель',
        dataIndex: 'teacher'
    }
];

const teacherColumns: IColumn[] = [
    {
        title: '№',
        dataIndex: 'i',
        width: 30
    },
    {
        title: 'Предмет',
        dataIndex: 'lesson',
        textAlign: 'left'
    },
    {
        title: 'Вид',
        dataIndex: 'type',
        width: 60
    },
    {
        title: 'Аудитория',
        dataIndex: 'cabinet',
        width: 100
    },
    {
        title: 'Группа',
        dataIndex: 'group',
        width: 68
    }
];

export const cachePath: string = path.join(__dirname, './../../../cache/images/');
const logo: Promise<Image> = loadImage(path.join(__dirname, './../../../public/mgke.png'));

export type ImageFile = {
    id: string,
    data: () => Buffer | Promise<Buffer>
}

export class ImageBuilder {
    public static readonly CACHE_PATH: string = cachePath;

    private static promises: {
        [id: string]: Promise<ImageFile>
    } = {};

    public static async getGroupImage(group: Group): Promise<ImageFile> {
        const id: string = createHash('sha256').update(JSON.stringify(group)).digest('base64url');
        if (this.promises[id] !== undefined) {
            return this.promises[id];
        }

        const process = (async () => {
            const filePath: string = path.join(cachePath, id + '.png');

            if (!config.dev && existsSync(filePath)) {
                return {
                    id: id,
                    data: () => {
                        return readFile(filePath)
                    }
                };
            }

            const data = await new this().buildGroupImage(group);
            await writeFile(filePath, data);

            return {
                id: id,
                data: () => {
                    return data
                }
            };
        })();

        this.promises[id] = process;
        await process;
        delete this.promises[id];

        return process;
    }

    public static async getTeacherImage(teacher: Teacher): Promise<ImageFile> {
        const id: string = createHash('sha256').update(JSON.stringify(teacher)).digest('base64url');
        if (this.promises[id] !== undefined) {
            return this.promises[id];
        }

        const process = (async () => {
            const filePath: string = path.join(cachePath, id + '.png');

            if (!config.dev && existsSync(filePath)) {
                return {
                    id: id,
                    data: () => {
                        return readFile(filePath)
                    }
                };
            }

            const data = await new this().buildTeacherImage(teacher);
            await writeFile(filePath, data);

            return {
                id: id,
                data: () => {
                    return data
                }
            };
        })();

        this.promises[id] = process;
        await process;
        delete this.promises[id];
        
        return process;
    }

    constructor() {
        if (!existsSync(cachePath)) {
            mkdirSync(cachePath, { recursive: true });
        }
    }

    private devicePixelRatio: number = 1;

    public async buildGroupImage(group: Group): Promise<Buffer> {
        const canvasList: Canvas[] = this._generateCanvasListForGroup(group.days);

        const { canvas, ctx, width } = await this._appendImageTemplate(canvasList);

        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.font = `${30 * this.devicePixelRatio}px sans-serif`;
        ctx.fillText(`Группа - ${group.group}`, width / 2, 45 * this.devicePixelRatio);

        return canvas.toBuffer('image/png');
    }

    public async buildTeacherImage(teacher: Teacher): Promise<Buffer> {
        const canvasList: Canvas[] = this._generateCanvasListForTeacher(teacher.days);

        const { canvas, ctx, width } = await this._appendImageTemplate(canvasList);

        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.font = `${30 * this.devicePixelRatio}px sans-serif`;
        ctx.fillText(`Преподаватель - ${teacher.teacher}`, width / 2, 45 * this.devicePixelRatio);

        return canvas.toBuffer('image/png');
    }

    private _generateCanvasListForGroup(days: GroupDay[]): Canvas[] {
        const maxLessons: number = Math.max(...days.map(_ => _.lessons.length));
        const canvasList: Canvas[] = [];

        for (const day of days) {
            const table = this._createTable2canvas(groupColumns, day);

            for (const i in day.lessons) {
                const lesson = day.lessons[i]
                if (!lesson) {
                    table.appendData([{
                        i: String(+i + 1)
                    }]);
                    continue;
                }

                const _lesson: GroupLessonExplain = Array.isArray(lesson) ? {
                    lesson: lesson.map((_: GroupLessonExplain): string => {
                        return `${_.subgroup}. ${_.lesson}`;
                    }).join('\n'),
                    type: lesson.map((_: GroupLessonExplain): string | null => _.type).join('\n'),
                    cabinet: lesson.map((_: GroupLessonExplain): string => _.cabinet || '-').join('\n'),
                    teacher: lesson.map((_: GroupLessonExplain): string | null => _.teacher).join('\n'),
                    comment: null
                } : lesson;

                table.appendData([{
                    i: String(+i + 1),
                    lesson: _lesson.lesson,
                    type: _lesson.type,
                    cabinet: _lesson.cabinet || '-',
                    teacher: _lesson.teacher
                }]);
            }

            for (let i = day.lessons.length; i < maxLessons; i++) {
                table.appendData([{
                    i: String(i + 1)
                }]);
            }

            canvasList.push(table.canvas);
        }

        return canvasList;
    }

    private _generateCanvasListForTeacher(days: TeacherDay[]): Canvas[] {
        const maxLessons: number = Math.max(...days.map(_ => _.lessons.length));
        const canvasList: Canvas[] = [];

        for (const day of days) {
            const table = this._createTable2canvas(teacherColumns, day);

            for (const i in day.lessons) {
                const lesson = day.lessons[i]
                if (!lesson) {
                    table.appendData([{
                        i: String(+i + 1)
                    }]);
                    continue;
                }

                table.appendData([{
                    i: String(+i + 1),
                    lesson: lesson.lesson,
                    type: lesson.type,
                    cabinet: lesson.cabinet || '-',
                    group: lesson.group
                }]);
            }

            for (let i = day.lessons.length; i < maxLessons; i++) {
                table.appendData([{
                    i: String(i + 1)
                }]);
            }

            canvasList.push(table.canvas);
        }

        return canvasList;
    }

    private async _appendImageTemplate(canvasList: Canvas[]) {
        const maxWidth: number = Math.max(...canvasList.map((canvas: Canvas): number => canvas.width));
        const maxHeight: number = Math.max(...canvasList.map((canvas: Canvas): number => canvas.height));

        const cells: number = 2;
        const rows: number = Math.ceil(canvasList.length / 2);

        const width = maxWidth * cells
        const height = (90 * this.devicePixelRatio) + maxHeight * rows

        const canvas = new Canvas(width * this.devicePixelRatio, height * this.devicePixelRatio, 'image');
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d', {
            alpha: false
        });
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cells; j++) {
                const canvas = canvasList[i * cells + j];
                if (!canvas) break;

                ctx.drawImage(canvas, maxWidth * j, maxHeight * i + 60 * this.devicePixelRatio);
            }
        }

        ctx.fillStyle = 'gray';
        const fontSize = 8 * this.devicePixelRatio
        ctx.font = `${fontSize}px sans-serif`;
        const paddingY = 9 * this.devicePixelRatio;
        const paddingX = 5 * this.devicePixelRatio;

        ctx.textAlign = 'left';
        ctx.fillText('Viber: https://mgke.keller.by/viber', paddingX, height - fontSize - paddingY * 2);
        ctx.fillText('TG: https://t.me/mgke_slave_bot', paddingX, height - fontSize - paddingY * 1);
        ctx.fillText('VK: https://vk.com/mgke_slave', paddingX, height - fontSize - paddingY * 0);

        ctx.textAlign = 'right';
        ctx.fillText(`Сгенерированно в: ${formatDateTime(new Date(), true)}`, width - paddingX, height - fontSize - paddingY * 1)
        ctx.fillText('Таблица с расписанием была сгенерированна в ботах Алексея Костюка из 63 группы', width - paddingX, height - fontSize - paddingY * 0);
        ctx.drawImage(await logo, 10 * this.devicePixelRatio, 10 * this.devicePixelRatio, 70 * this.devicePixelRatio, 70 * this.devicePixelRatio);

        return { canvas, ctx, width, height };
    }

    private _createTable2canvas(columns: IColumn[], day: GroupDay | TeacherDay): Table2canvas<any> {
        const canvas = new Canvas(0, 0, 'image');

        return new Table2canvas({
            bgColor: 'white',
            canvas: canvas,
            columns: columns,
            text: `${getWeekdayNameByStrDate(day.day)}, ${day.day}`,
            textStyle: {
                fontSize: '18px'
            },
            style: {
                textAlign: 'center',
                headerRowHeight: 30
            },
            devicePixelRatio: this.devicePixelRatio
        });
    }
}

//ImageBuilder.getTeacherImage(require('../../../cache/rasp/teachers.json').timetable['Леус Ж. В.'])