import { Request, Response } from 'express';
import path from 'path';
import StatusCode from 'status-code-enum';
import { config } from '../../../config';
import { App, AppService } from '../../app';
import { ImageKey } from '../../key/image';
import { ImageBuilder } from './builder';

export class ImageService implements AppService {
    public builder: ImageBuilder;
    private app: App;

    constructor(app: App) {
        this.app = app;
        this.builder = new ImageBuilder();
    }

    public run() {
        if (this.app.isServiceRegistered('http')) {
            const server = this.app.getService('http').getServer();

            server.get('/image/:image', this.getImage.bind(this));

            if (config.dev) {
                server.get('/image-sign/:image', this.getImageSign.bind(this));
            }
        }
    }

    private getImage(request: Request, response: Response) {
        if (!this.checkSign(request)) {
            return response.status(StatusCode.ClientErrorForbidden).send('Invalid image signature');
        }

        return response.status(StatusCode.SuccessOK).sendFile(path.join(ImageBuilder.CACHE_PATH, request.params.image + '.png'));
    }

    private getImageSign(request: Request, response: Response) {
        const image = request.params.image;
        if (!image) {
            return response.status(StatusCode.ClientErrorBadRequest).send('Image is not entered');
        }

        const key: string = new ImageKey(config.encrypt_key).getKey(image, 'http-dev');

        return response.send(key);
    }

    private checkSign(request: Request): boolean {
        const sign = request.query.sign;
        const image = request.params.image;

        if (!sign || typeof sign !== 'string') return false;
        if (!image) return false;

        return new ImageKey(config.encrypt_key).checkKey(image, sign);
    }
}