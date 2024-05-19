import { BotChat } from './Chat';
import { LessonAlias } from './LessonAlias';

BotChat.hasMany(LessonAlias, {
    sourceKey: 'id',
    foreignKey: 'chatId'
});

LessonAlias.belongsTo(BotChat, {
    foreignKey: 'chatId',
    targetKey: 'id'
});

export * from './Abstract';
export * from './Chat';
export * from './LessonAlias';