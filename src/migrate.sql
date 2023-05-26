-- Вставка данных из таблицы tg_bot_chats
INSERT INTO chat_options (service, id, accepted, ref, scene, mode, [group], teacher, noticeChanges, showAbout, showDaily, showWeekly, showCalls, showFastGroup, showFastTeacher, removePastDays, deleteLastMsg, lastMsgId, lastMsgTime, deleteUserMsg, allowSendMess, subscribeMess, needUpdateButtons, showParserTime, eula, deactivateSecondaryCheck)
SELECT 'tg' AS service, id, accepted, ref, scene, mode, [group], teacher, noticeChanges, showAbout, showDaily, showWeekly, showCalls, showFastGroup, showFastTeacher, removePastDays, deleteLastMsg, lastMsgId, lastMsgTime, deleteUserMsg, allowSendMess, subscribeMess, needUpdateButtons, showParserTime, eula, deactivateSecondaryCheck
FROM tg_bot_chats;

-- Вставка данных из таблицы vk_bot_chats
INSERT INTO chat_options (service, id, accepted, ref, scene, mode, [group], teacher, noticeChanges, showAbout, showDaily, showWeekly, showCalls, showFastGroup, showFastTeacher, removePastDays, deleteLastMsg, lastMsgId, lastMsgTime, deleteUserMsg, allowSendMess, subscribeMess, needUpdateButtons, showParserTime, eula, deactivateSecondaryCheck)
SELECT 'vk' AS service, id, accepted, ref, scene, mode, [group], teacher, noticeChanges, showAbout, showDaily, showWeekly, showCalls, showFastGroup, showFastTeacher, removePastDays, deleteLastMsg, lastMsgId, lastMsgTime, deleteUserMsg, allowSendMess, subscribeMess, needUpdateButtons, showParserTime, eula, deactivateSecondaryCheck
FROM vk_bot_chats;

-- Вставка данных из таблицы viber_bot_chats
INSERT INTO chat_options (service, id, accepted, ref, scene, mode, [group], teacher, noticeChanges, showAbout, showDaily, showWeekly, showCalls, showFastGroup, showFastTeacher, removePastDays, deleteLastMsg, lastMsgId, lastMsgTime, deleteUserMsg, allowSendMess, subscribeMess, needUpdateButtons, showParserTime, eula, deactivateSecondaryCheck)
SELECT 'viber' AS service, id, accepted, ref, scene, mode, [group], teacher, noticeChanges, showAbout, showDaily, showWeekly, showCalls, showFastGroup, showFastTeacher, removePastDays, deleteLastMsg, lastMsgId, lastMsgTime, deleteUserMsg, allowSendMess, subscribeMess, needUpdateButtons, showParserTime, eula, deactivateSecondaryCheck
FROM viber_bot_chats;
