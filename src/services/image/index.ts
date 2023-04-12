import { Application, Request, Response } from 'express';
import path from 'path';
import StatusCode from 'status-code-enum';
import { config } from '../../../config';
import { ImageKey } from '../../key/image';
import { ImageBuilder } from './builder';

export class ImageService {
    constructor(app: Application) {
        app.get('/image/:image', this.getImage.bind(this))

        if (config.dev) {
            app.get('/image-sign/:image', this.getImageSign.bind(this))
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