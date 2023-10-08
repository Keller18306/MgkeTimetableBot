import { existsSync, readdirSync, statSync } from "fs";
import path from "path";
import { TelegramBotCommand } from "puregram/generated";
import { parsePayload } from "../../utils";
import { AbstractCallback, AbstractCommand } from "./abstract";

const cmdRootPath = path.join(__dirname, 'commands');
const cbRootPath = path.join(__dirname, 'callbacks');

type LoadedInstance<T> = {
    id: string,
    path: string,
    instance: T
}

export class CommandController {
    private static _instance?: CommandController;

    public commands: {
        [id: string]: LoadedInstance<AbstractCommand>
    } = {};

    public callbacks: {
        [id: string]: LoadedInstance<AbstractCallback>
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

        return cmd.instance;
    }

    public static searchCommandByMessage(message?: string, scene?: string | null): AbstractCommand | null {
        if (!message) return null

        const cmds = this.instance.commands;

        for (const id in cmds) {
            const cmd = cmds[id].instance;

            if (scene !== undefined && cmd.scene !== undefined) {
                if (scene !== cmd.scene) continue;
            }

            if (cmd.regexp == null || !cmd.regexp.test(message)) continue;

            return cmd;
        }

        return null;
    }

    public static searchCommandByPayload(payload?: string, scene?: string | null): AbstractCommand | null {
        const parsed = parsePayload(payload);
        if (!payload || !parsed) return null;

        const { action } = parsed;
        const cmds = this.instance.commands;

        for (const id in cmds) {
            const cmd = cmds[id].instance;

            if (cmd.payload == null || cmd.payload != action) continue;

            return cmd;
        }

        return null;
    }

    public static getCallbackById(id: string): AbstractCallback {
        const cb = this.instance.callbacks[id];

        if (!cb) throw new Error(`Command with id '${id}' not found`);

        return cb.instance;
    }

    public static getCallbackByPayload(payload?: string): AbstractCallback | null {
        const parsed = parsePayload(payload);
        if (!payload || !parsed) return null;

        const { action } = parsed;

        const cbs = this.instance.callbacks;

        for (const id in cbs) {
            const cb = cbs[id].instance;

            if (cb.action != action) continue;

            return cb;
        }

        return null;
    }

    public static getBotCommands(showAdminCommands: boolean = false): TelegramBotCommand[] {
        return Object.values(this.instance.commands).reduce<TelegramBotCommand[]>((commands, { instance }) => {
            const tgCommand = instance.tgCommand;

            if (tgCommand && (!instance.adminOnly || showAdminCommands)) {
                tgCommand.command = tgCommand.command.toLowerCase();
                if (instance.adminOnly) {
                    tgCommand.description = '[адм] ' + tgCommand.description;
                }

                commands.push(tgCommand)
            }

            return commands;
        }, [])
    }

    public static reloadCommandById(id: string) {
        this.instance.reloadCommandById(id);
    }

    constructor() {
        if (CommandController._instance) throw new Error('CommandController is singleton');
        CommandController._instance = this;

        this.loadFromDirectory(AbstractCommand, cmdRootPath)
        console.log(`[BOTS] Loaded ${Object.keys(this.commands).length} commands`)

        this.loadFromDirectory(AbstractCallback, cbRootPath)
        console.log(`[BOTS] Loaded ${Object.keys(this.callbacks).length} callbacks`)

        // if (config.dev) {
        //     this.initFolderWatcher(cmdsPath);
        // }
    }

    private loadFromDirectory(classType: typeof AbstractCommand | typeof AbstractCallback, dir: string, rootPath?: string) {
        if (!rootPath) {
            if (!existsSync(dir)) {
                return;
            }

            rootPath = dir;
        }

        const files = readdirSync(dir);

        for (const file of files) {
            const filePath: string = path.join(dir, file);

            if (statSync(filePath).isDirectory()) {
                this.loadFromDirectory(classType, filePath, rootPath);
                continue;
            }

            this.loadClassFromFile(classType, rootPath, filePath)
        }
    }

    public loadClassFromFile(classType: typeof AbstractCommand | typeof AbstractCallback, rootPath: string, filePath: string) {
        if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) {
            return;
        }

        if (!existsSync(filePath)) {
            return;
        }

        const { default: cmdClass } = require(filePath);
        if (cmdClass == undefined) return;

        const cmd = new cmdClass();
        if (!(cmd instanceof classType)) {
            throw new Error(`incorrect command class: ${filePath}`);
        }

        const id = this.pathToId(rootPath, filePath);
        cmd.id = id;

        // if (config.dev) {
        //     this.initCommandWatcher(value);
        // }

        if (cmd instanceof AbstractCommand) {
            this.commands[id] = {
                id: id,
                path: filePath,
                instance: cmd
            };
        }

        if (cmd instanceof AbstractCallback) {
            this.callbacks[id] = {
                id: id,
                path: filePath,
                instance: cmd
            };
        }
    }

    public unloadCommand(cmd: LoadedInstance<AbstractCommand>) {
        delete require.cache[cmd.path];
        delete this.commands[cmd.id];
    }

    public reloadCommandById(id: string) {
        const cmd = this.commands[id];
        if (!cmd) {
            throw new Error(`command with id '${id}' not found`)
        }

        this.unloadCommand(cmd);
        this.loadClassFromFile(AbstractCommand, cmdRootPath, cmd.path);
    }

    private pathToId(rootPath: string, filePath: string) {
        return filePath
            .replace(rootPath, '')
            .replace(/^(\\|\/)/i, '')
            .replace(/(\.(ts|js))$/i, '')
            .replace(/\\|\//ig, '_');
    }

    // protected initCommandWatcher({ }: CommandValue) {

    // }

    // protected initFolderWatcher(folder: string) {

    // }
}