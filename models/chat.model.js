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
        const query = `
            SELECT 
                chats.*, 
                students.student_id, 
                students.fname, 
                students.lname, 
                students.enrollment_no 
            FROM chats 
            JOIN students ON chats.sent_from = students.student_id 
            WHERE chats.sent_to = ?
        `;

        db.query(query, [sentTo], (err, results) => {
            if (err) {
                return callback(err, null);
            }
    
            // Map the results to include student details
            const chatsWithStudentDetails = results.map(row => ({
                ...row,
                student: {
                    student_id: row.student_id,
                    fname: row.fname,
                    lname: row.lname,
                    enrollment_no: row.enrollment_no
                }
            }));
    
            callback(null, chatsWithStudentDetails);
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
