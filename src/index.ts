import { config } from "../config";
import { App } from "./app";
import { startVanishCronJob as setupVanishCron } from "./db";

const app = new App(config.services);

app.runServices();

setupVanishCron(app);

export { app };