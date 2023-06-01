import Alice, { IApiResponseBody, IContext, Reply } from "@keller18306/yandex-dialogs-sdk";
import { Application, NextFunction, Request, Response } from "express";
import StatusCode from "status-code-enum";
import { SkillController } from "./controller";
import { AliceUser } from "./user";


export class AliceApp {
    private alice: Alice;
    private controller: SkillController;

    constructor(app: Application) {
        this.alice = new Alice();
        this.controller = new SkillController();

        app.use('/alice', this.handleRequest.bind(this))
        this.alice.any(this.handleCommand.bind(this))

        // this.alice.command(/проверка/i, (ctx) => {
        //     return Reply.text('Проверка звука взрыва', {
        //         tts: 'Проверка звука взрыва <speaker audio="alice-sounds-things-explosion-1.opus">'
        //     })
        // })

        // this.alice.command(/помощь/i, (ctx) => {
        //     return Reply.text([
        //         'Данный навык позволяет узнавать расписание в МГКЭ электроники через меня.',
        //         'Для того, чтобы получить расписание, вы можете установить себе на постоянно группу или имя преподавателя. Для этого можете сказать "Установи группу 63"',
        //         'Или же вы можете просто узнать расписание конкретной группы или преподавателя. Для этого можете сказать "Группа 63"'
        //     ].join('\n\n'))
        // })

        // this.alice.command(/(на )?завтра/i, (ctx) => {
        //     return Reply.text('Завтра вторник. Со второй пары Математика, Английский, ОСА, Физкультура.')
        // })

        // this.alice.command(/(на )?сегодня/i, (ctx) => {
        //     return Reply.text('Сегодня среда. Со второй пары Математика, Английский, ОСА, Физкультура.')
        // })      
    }

    private async handleCommand(ctx: IContext): Promise<IApiResponseBody> {
        const user = AliceUser.getById(ctx.user?.user_id || ctx.application.application_id);

        const matched = this.controller.matchSkill(ctx);
        if (!matched) {
            return Reply.text('Извините, но я вас не поняла. Попробуйте сказать по-другому или напишите разработчику моего навыка, чтобы он меня научил этому.')
        }

        const { skill, match } = matched

        const response = skill.controller(ctx, user, match);

        return response;
    }

    private async handleRequest(request: Request, response: Response, next: NextFunction) {
        try {
            const result = await this.alice.handleRequest(request.body)

            response.send(result)
        } catch (e: any) {
            response.status(StatusCode.ServerErrorInternal).send(e.toString())
        }
    }
}