import { existsSync, readdirSync, statSync } from "fs";
import path from "path";
import { TelegramBotCommand } from "puregram/generated";
import { AbstractCommand } from "./abstract";

const cmdsPath = path.join(__dirname, 'commands');
type CommandValue = {
    id: string,
    path: string,
    command: AbstractCommand
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

    public static getCommandById(id: string): AbstractCommand {
        const cmd = this.instance.commands[id];

        if (!cmd) throw new Error(`Command with id '${id}' not found`);

        return cmd.command;
    }

    public static searchCommandByMessage(message?: string, scene?: string | null): AbstractCommand | null {
        if (!message) return null

        const cmds = this.instance.commands;

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

    public static searchCommandByPayload(payload?: string, scene?: string | null): AbstractCommand | null {
        if (!payload) return null;

        const cmds = this.instance.commands;

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
                    tgCommand.description = '[адм] ' + tgCommand.description;
                }
                
                commands.push(tgCommand)
            }

            return commands;
        }, [])
    }

    public static reloadCommandById(id: string) {
        this.instance.reloadCommand(id);
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

            this.loadCommand(filePath)
        }
    }

    public loadCommand(filePath: string) {
        if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) {
            return;
        }

        if (!existsSync(filePath)) {
            return;
        }

        const { default: cmdClass } = require(filePath);
        if (cmdClass == undefined) return;

        const cmd: AbstractCommand = new cmdClass();
        if (!(cmd instanceof AbstractCommand)) {
            throw new Error(`incorrect command class: ${filePath}`);
        }
        
        const id = this.pathToId(filePath);
        cmd.id = id;

        const value: CommandValue = {
            id: id,
            path: filePath,
            command: cmd
        };

        // if (config.dev) {
        //     this.initCommandWatcher(value);
        // }

        this.commands[id] = value;
    }

    public unloadCommand(cmd: CommandValue) {
        delete require.cache[cmd.path];
        delete this.commands[cmd.id];
    }

    public reloadCommand(id: string) {
        const cmd = this.commands[id];
        if (!cmd) {
            throw new Error(`command with id '${id}' not found`)
        }

        this.unloadCommand(cmd);
        this.loadCommand(cmd.path);
    }

    private pathToId(filePath: string) {
        return filePath
            .replace(cmdsPath, '')
            .replace(/^(\\|\/)/i, '')
            .replace(/(\.(ts|js))$/i, '')
            .replace(/\\|\//ig, '_');
    }

    // protected initCommandWatcher({ }: CommandValue) {

    // }

    // protected initFolderWatcher(folder: string) {

    // }
}