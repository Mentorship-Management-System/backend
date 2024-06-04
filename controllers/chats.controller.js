const chatModel = require('../models/chat.model');
const meetingModel = require('../models/meeting.model');
const studentModel = require('../models/student.model');
const mentorModel = require('../models/mentor.model');
const sendPasswordEmail = require('../nodeMailer');

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

            chatModel.getChatsBySentFrom((req.body.sent_from), (err, chats) => {
                if (err) {
                    console.error('Error fetching chat:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
                console.log("Chat", chats[chats.length - 1]);
                let mentorId = chats[chats.length - 1].sent_to;
                console.log("Mentor ID", mentorId);
                mentorModel.getMentorById(mentorId, (er, results) => {
                    if (er) {
                        console.error('Error fetching chat:', err);
                        res.status(500).json({ error: 'Internal Server Error' });
                        return;
                    }
                    if(results && results.length === 0){
                        res.status(201).json({ success: true, message: 'Chat added successfully', chats: chats.reverse() });
                        return;
                    }

                    console.log("Mentor", results);
                    let payload = {
                        type: "new_message",
                        to: results.email || results.gsuite_id
                    }
                    sendPasswordEmail(payload)
                        .then(() => {
                            console.log("Sending email.");
                            res.status(201).json({ success: true, message: 'Chat added successfully', chats: chats.reverse() });
                        })
                        .catch((error) => {
                            res.status(201).json({ success: true, message: 'Chat added successfully', chats: chats.reverse() });;
                            console.error("Error sending email:", error);
                        });
                })
            })
            
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
        chatModel.updateAcknowledgedById(chatId, null, (err, success) => {
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
        const { meeting_date } = req.body;
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
                // time: meeting_time,
                mentor_id: chat.sent_to,
                student_ids: chat.sent_from
            };
            // console.log("Meeting Data", meetingData);
            meetingModel.addMeeting(meetingData, (err, meetings) => {
                if (err) {
                    console.error('Error adding meetings:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                let new_meeting = meetings.find(meeting => meeting.chat_id === chatId);
                
                // Update chat acknowledgement field to true
                chatModel.updateAcknowledgedById(chatId, new_meeting.meeting_id, (err, success) => {
                    if (err || !success) {
                        console.error('Error updating chat acknowledgement:', err);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }

                    chatModel.getChatById(chatId, (err, chat) => {
                        if (err) {
                            console.error('Error fetching chat:', err);
                            res.status(500).json({ error: 'Internal Server Error' });
                            return;
                        }
                        studentModel.getStudentsByIds([chat.sent_from], (er, students) => {
                            if (er) {
                                console.error('Error fetching chat:', err);
                                res.status(500).json({ error: 'Internal Server Error' });
                                return;
                            }
                            (students).forEach(element => {
                                let payload = {
                                    type: "new_meeting",
                                    to: element.gsuite_id || element.email
                                }
                                sendPasswordEmail(payload)
                                    .then(() => {
                                        console.log("Sending email.");
                                        res.status(201).json({ success: true, message: 'Meeting created from chat successfully', meetings });
                                    })
                                    .catch((error) => {
                                        res.status(200).json({ success: true, message: 'Meeting created from chat successfully', meetings });
                                        console.error("Error sending email:", error);
                                    });
                            });
                        })
                    })

                    
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
            chatModel.getChatById(chatId, (error, chat) => {
                if (error) {
                    console.error('Error fetching chat:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
                studentModel.getStudentsByIds([chat.sent_from], (er, students) => {
                    if (er) {
                        console.error('Error fetching chat:', err);
                        res.status(500).json({ error: 'Internal Server Error' });
                        return;
                    }
                    (students).forEach(element => {
                        let payload = {
                            type: "mentor_reply",
                            to: element.gsuite_id || element.email
                        }
                        sendPasswordEmail(payload)
                            .then(() => {
                                console.log("Sending email.");
                                res.status(200).json({ success: true, message: 'Chat acknowledged and replied successfully' });
                            })
                            .catch((error) => {
                                res.status(200).json({ success: true, message: 'Chat acknowledged and replied successfully' });
                                console.error("Error sending email:", error);
                            });
                    });
                })
            })
        });
    }
};

module.exports = chatController;
