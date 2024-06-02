const chatModel = require('../models/chat.model');
const meetingModel = require('../models/meeting.model');

const chatController = {
    getAllChats: (req, res) => {
        chatModel.getAllChats((err, chats) => {
            if (err) {
                console.error('Error fetching chats:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ success: true, chats });
        });
    },

    getChatById: (req, res) => {
        const chatId = req.params.chatId;
        chatModel.getChatById(chatId, (err, chat) => {
            if (err) {
                console.error('Error fetching chat by ID:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (!chat) {
                res.status(404).json({ error: 'Chat not found' });
                return;
            }
            res.status(200).json({ success: true, chat });
        });
    },

    addChat: (req, res) => {
        const chatData = {...req.body, date: new Date().toISOString(), time: "00:00"};
        chatModel.addChat(chatData, (err, chats) => {
            if (err) {
                console.error('Error adding chat:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(201).json({ success: true, message: 'Chat added successfully', chats: chats.reverse() });
        });
    },

    updateChatById: (req, res) => {
        const chatId = req.params.chatId;
        const newData = req.body;
        chatModel.updateChatById(chatId, newData, (err, success) => {
            if (err) {
                console.error('Error updating chat:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (!success) {
                res.status(404).json({ error: 'Chat not found' });
                return;
            }
            res.status(200).json({ success: true, message: 'Chat updated successfully' });
        });
    },

    deleteChatById: (req, res) => {
        const chatId = req.params.chatId;
        chatModel.deleteChatById(chatId, (err, success) => {
            if (err) {
                console.error('Error deleting chat:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (!success) {
                res.status(404).json({ error: 'Chat not found' });
                return;
            }
            res.status(200).json({ success: true, message: 'Chat deleted successfully' });
        });
    },

    getChatsBySentFrom: (req, res) => {
        const sentFrom = req.params.sentFrom;
        chatModel.getChatsBySentFrom(sentFrom, (err, chats) => {
            if (err) {
                console.error('Error fetching chats by sent_from:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ success: true, chats: chats.reverse() });
        });
    },

    getChatsBySentTo: (req, res) => {
        const sentTo = req.params.sentTo;
        chatModel.getChatsBySentTo(sentTo, (err, chats) => {
            if (err) {
                console.error('Error fetching chats by sent_to:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ success: true, chats: chats.reverse() });
        });
    },

    updateAcknowledgedById: (req, res) => {
        const chatId = req.params.chatId;
        chatModel.updateAcknowledgedById(chatId, (err, success) => {
            if (err) {
                console.error('Error updating acknowledged field:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (!success) {
                res.status(404).json({ error: 'Chat not found' });
                return;
            }
            res.status(200).json({ success: true, message: 'Acknowledged field updated successfully' });
        });
    },

    acknowledgeByMeeting: (req, res) => {
        const chatId = req.params.chatId;
        const { meeting_date, meeting_time } = req.body;
        chatModel.getChatById(chatId, (err, chat) => {
            if (err) {
                console.error('Error fetching chat by ID:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }
    
            // console.log("Chat fetched", chat);
            
            let meetingData = {
                chat_id: chatId,
                title: `Acknowledgement Meeting`,
                description: `Meeting set for - ${chat.message}`,
                date: meeting_date,
                time: meeting_time,
                mentor_id: chat.sent_to,
                student_ids: chat.sent_from
            };
            // console.log("Meeting Data", meetingData);
            meetingModel.addMeeting(meetingData, (err, meeting) => {
                if (err) {
                    console.error('Error adding meeting:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
                
                // Update chat acknowledgement field to true
                chatModel.updateAcknowledgedById(chatId, (err, success) => {
                    if (err || !success) {
                        console.error('Error updating chat acknowledgement:', err);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }

                    console.log({ success: true, message: 'Meeting created from chat successfully', meeting });
                    res.status(201).json({ success: true, message: 'Meeting created from chat successfully', meeting });
                });
            });
        });
    },

    acknowledgeAndReplyChat: (req, res) => {
        const chatId = req.params.chatId;
        const mentorReply = req.body.reply;
        chatModel.acknowledgeAndReplyChat(chatId, mentorReply, (err, success) => {
            if (err) {
                console.error('Error acknowledging and replying chat:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ success: true, message: 'Chat acknowledged and replied successfully' });
        });
    }
};

module.exports = chatController;
