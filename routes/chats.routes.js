const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chats.controller');

router.get('/all', chatController.getAllChats);
router.get('/get/:chatId', chatController.getChatById);
router.get('/sent-from/:sentFrom', chatController.getChatsBySentFrom);
router.get('/sent-to/:sentTo', chatController.getChatsBySentTo);

router.post('/add', chatController.addChat);

router.patch('/acknowledge/:chatId', chatController.updateAcknowledgedById);

router.delete('/:chatId', chatController.deleteChatById);

router.put('/acknowledge-reply/:chatId', chatController.acknowledgeAndReplyChat);
router.put('/acknowledge/add_meeting/:chatId', chatController.acknowledgeByMeeting);
router.put('/:chatId', chatController.updateChatById);

module.exports = router;
