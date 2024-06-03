const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chats.controller');
const authMiddleware = require('../middleware/authMiddleware');


router.get('/all', authMiddleware, chatController.getAllChats);
router.get('/get/:chatId', authMiddleware, chatController.getChatById);
router.get('/sent-from/:sentFrom', authMiddleware, chatController.getChatsBySentFrom);
router.get('/sent-to/:sentTo', authMiddleware, chatController.getChatsBySentTo);

router.post('/add', authMiddleware, chatController.addChat);

router.patch('/acknowledge/:chatId', authMiddleware, chatController.updateAcknowledgedById);

router.delete('/:chatId', authMiddleware, chatController.deleteChatById);

router.put('/acknowledge-reply/:chatId', authMiddleware, chatController.acknowledgeAndReplyChat);
router.put('/acknowledge/add_meeting/:chatId', authMiddleware, chatController.acknowledgeByMeeting);
router.put('/:chatId', authMiddleware, chatController.updateChatById);

module.exports = router;
