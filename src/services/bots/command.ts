import { readdirSync, statSync } from "fs";
import path from "path";
import { BotCommand } from "puregram";
import { TelegramBotCommand } from "puregram/generated";
import { DefaultCommand } from "./abstract/command";

const cmdsPath = path.join(__dirname, 'commands');
type CommandValue = {
    id: string,
    path: string,
    command: DefaultCommand
}

export class CommandController {
    private static _instance?: CommandController;

    public commands: {
        [id: string]: CommandValue
    } = {};

    public static get instance(): CommandController {
        if (!this._instance) {
            this._instance = new CommandController();
        }

        return this._instance;
    }

    public static getCommand(id: string): DefaultCommand {
        const _this = this.instance;

        if (!_this.commands[id]) throw new Error(`Command with id '${id}' not found`);

        return _this.commands[id].command;
    }

    public static searchCommandByMessage(message?: string, scene?: string | null): DefaultCommand | null {
        if (!message) return null

        const _this = this.instance;
        const cmds = _this.commands;

        for (const id in cmds) {
            const cmd = cmds[id].command;

            if (scene !== undefined && cmd.scene !== undefined) {
                if (scene !== cmd.scene) continue;
            }

            if (cmd.regexp == null || !cmd.regexp.test(message)) continue;

            return cmd;
        }

        return null;
    }

    public static searchCommandByPayload(payload?: string, scene?: string | null): DefaultCommand | null {
        if (!payload) return null;

        const _this = this.instance;
        const cmds = _this.commands;

        for (const id in cmds) {
            const cmd = cmds[id].command;

            if (cmd.payload == null || cmd.payload != payload) continue;

            return cmd;
        }

        return null;
    }

    public static getBotCommands(showAdminCommands: boolean = false): TelegramBotCommand[] {
        return Object.values(this.instance.commands).reduce<TelegramBotCommand[]>((commands, { command }) => {
            const tgCommand = command.tgCommand;

            if (tgCommand && (!command.adminOnly || showAdminCommands)) {
                tgCommand.command = tgCommand.command.toLowerCase();
                if (command.adminOnly) {
                    tgCommand.description = '[админ] ' + tgCommand.description;
                }
                
                commands.push(tgCommand)
            }

            return commands;
        }, [])
    }

    constructor() {
        if (CommandController._instance) throw new Error('CommandController is singleton');
        CommandController._instance = this;

        this.loadCommands(cmdsPath);

        // if (config.dev) {
        //     this.initFolderWatcher(cmdsPath);
        // }
    }

    protected loadCommands(cmdsPath: string) {
        this.loadFromDirectory(cmdsPath)

        console.log(`[BOTS] Loaded ${Object.keys(this.commands).length} commands`)

        return this.commands
    }

    private loadFromDirectory(dir: string) {
        const files = readdirSync(dir);

        for (const file of files) {
            const filePath: string = path.join(dir, file);

            if (statSync(filePath).isDirectory()) {
                this.loadFromDirectory(filePath)
                continue;
            }

            if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) {
                continue;
            }

            const { default: cmdClass } = require(filePath);
            if (cmdClass == undefined) continue;

            const cmd: DefaultCommand = new cmdClass();
            if (cmd.id == undefined) continue;

            if (Object.keys(this.commands).includes(cmd.id)) {
                throw new Error(`cmd id '${cmd.id}' is already registred`);
            }

            const value: CommandValue = {
                id: cmd.id,
                path: filePath,
                command: cmd
            };

            // if (config.dev) {
            //     this.initCommandWatcher(value);
            // }

            this.commands[cmd.id] = value;
        }
    }

    // protected initCommandWatcher({ }: CommandValue) {

    // }

    // protected initFolderWatcher(folder: string) {

    // }
}