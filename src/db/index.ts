import { Options, Sequelize } from 'sequelize';
import { config } from '../../config';

export const sequelize = new Sequelize(Object.assign<Options, Options>(config.db, {
    logging: config.dev // Логируем все SQL запросы в режиме разработки
}));

export * from './clean';
