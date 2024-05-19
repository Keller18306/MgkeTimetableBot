import SQLite3 from 'better-sqlite3';
import { Sequelize } from 'sequelize';
import { config } from '../../config';

export const dbOld = new SQLite3('sqlite3.db');
export const sequelize = new Sequelize(config.db);

export * from './clean';