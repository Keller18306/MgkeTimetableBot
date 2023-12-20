import Alice, { IApiResponseBody, IContext, Reply, Scene, Stage } from "@keller18306/yandex-dialogs-sdk";
import { Application, NextFunction, Request, Response } from "express";
import StatusCode from "status-code-enum";
import { SkillController } from "./controller";
import { AliceUser } from "./user";

export class AliceApp {
    private alice: Alice;
    private controller: SkillController;
    private stage: Stage;

    constructor(app: Application) {
        this.alice = new Alice();
        this.controller = new SkillController();
        this.stage = new Stage();

        // const scene = new Scene('aaa');
        // scene.

        app.use('/alice', this.handleRequest.bind(this))
        this.alice.use(this.stage.getMiddleware() as any);
        this.alice.any(this.handleCommand.bind(this))      
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