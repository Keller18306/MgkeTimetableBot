import { App } from "../../app";

const app = new App(['parser']);

const parser = app.getService('parser');
parser.parse().then(console.log, console.error);