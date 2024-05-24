const db = require('../db');

const chatModel = {
    getAllChats: (callback) => {
        db.query('SELECT * FROM chats order by chat_id DESC', (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    getChatById: (chatId, callback) => {
        db.query('SELECT * FROM chats WHERE chat_id = ?', [chatId], (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results[0]); // Assuming chat_id is unique
        });
    },

    addChat: (chatData, callback) => {
        db.query('INSERT INTO chats SET ?', chatData, (err, result) => {
            if (err) {
                return callback(err);
            }
            db.query('SELECT * FROM chats where sent_from = ? order by chat_id DESC', [chatData.sent_from], (err, results) => {
                if (err) {
                    return callback(err, null);
                }
                callback(null, results);
            });
        });
    },

    updateChatById: (chatId, newData, callback) => {
        db.query('UPDATE chats SET ? WHERE chat_id = ?', [newData, chatId], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result.affectedRows > 0);
        });
    },

    deleteChatById: (chatId, callback) => {
        db.query('DELETE FROM chats WHERE chat_id = ?', [chatId], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result.affectedRows > 0);
        });
    },

    getChatsBySentFrom: (sentFrom, callback) => {
        db.query('SELECT * FROM chats WHERE sent_from = ?', [sentFrom], (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    getChatsBySentTo: (sentTo, callback) => {
        db.query('SELECT * FROM chats WHERE sent_to = ?', [sentTo], (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    updateAcknowledgedById: (chatId, callback) => {
        db.query('UPDATE chats SET acknowledged = ? WHERE chat_id = ?', [true, chatId], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result.affectedRows > 0);
        });
    },

    acknowledgeAndReplyChat: (chatId, mentorReply, callback) => {
        // Update the acknowledgment status of the chat
        db.query('UPDATE chats SET acknowledged = ?, reply_by_mentor = ? WHERE chat_id = ?', [true, mentorReply, chatId], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, true);
        });
    }
};

module.exports = chatModel;
