import { Options, Sequelize } from 'sequelize';
import { config } from '../../config';

export const sequelize = new Sequelize(Object.assign<Options, Options>({
    logging: config.dev ? console.log : false // Логируем все SQL запросы в режиме разработки
}, config.db));

export * from './clean';
