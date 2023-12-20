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

    public commands: {
        [id: string]: LoadedInstance<AbstractCommand>
    } = {};

    public callbacks: {
        [id: string]: LoadedInstance<AbstractCallback>
    } = {};

    private _init: Promise<void> | undefined;

    constructor() {
        if (CommandController._instance) throw new Error('CommandController is singleton');
        CommandController._instance = this;
    }

    public init() {
        if (!this._init) {
            this._init = this.load();
        }

        return this._init;
    }

    private async load() {
        await Promise.all([
            (async () => { 
                const promises = this.loadFromDirectory(AbstractCommand, cmdRootPath);
                await Promise.all(promises);

                console.log(`[BOTS] Loaded ${Object.keys(this.commands).length} commands`)
            })(),
            (async () => { 
                const promises = this.loadFromDirectory(AbstractCallback, cbRootPath);
                await Promise.all(promises);

                console.log(`[BOTS] Loaded ${Object.keys(this.callbacks).length} callbacks`)
            })()
        ])       
    }

    private loadFromDirectory(classType: typeof AbstractCommand | typeof AbstractCallback, dir: string, rootPath?: string) {
        const promises: Promise<void>[] = [];

        if (!rootPath) {
            if (!existsSync(dir)) {
                return promises;
            }

            rootPath = dir;
        }

        const files = readdirSync(dir);
        for (const file of files) {
            const filePath: string = path.join(dir, file);

            if (statSync(filePath).isDirectory()) {
                const _promises = this.loadFromDirectory(classType, filePath, rootPath);
                promises.push(..._promises);

                continue;
            }

            promises.push(this.loadClass(classType, rootPath, filePath));
        }

        return promises;
    }

    public async loadClass(classType: typeof AbstractCommand | typeof AbstractCallback, rootPath: string, filePath: string) {
        if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) {
            return;
        }

        if (!existsSync(filePath)) {
            return;
        }

        const { default: cmdClass } = await import(filePath);
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
        this.loadClass(AbstractCommand, cmdRootPath, cmd.path);
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