const db = require('../db');

const meetingModel = {
    getAllMeetings: (callback) => {
        db.query('SELECT * FROM meetings', (err, results) => {
            if (err) {
                return callback(err, null);
            }
            const meetingPromises = results.map(meeting => {
                if(meeting.confirmation){
                    return new Promise((resolve, reject) => {
                        const confirmedStudents = meeting.confirmation.split(',').map(id => id.trim());
                        db.query('SELECT * FROM students WHERE student_id IN (?)', [confirmedStudents], (err, studentResults) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            meeting.confirmed_students = studentResults;
                            resolve(meeting);
                        });
                    });
                } else {
                    return new Promise((resolve, reject) => {
                        meeting.confirmed_students = [];
                        resolve(meeting);
                    });
                }
            });

            Promise.all(meetingPromises)
                .then(meetings => {
                    callback(null, meetings);
                })
                .catch(err => {
                    callback(err, null);
                });
        });
    },

    addMeeting: (meetingData, callback) => {
        db.query('INSERT INTO meetings SET ?', meetingData, (err, result) => {
            if (err) {
                return callback(err);
            }
            // Fetch the inserted meeting by its ID and return it in the callback
            db.query('SELECT * FROM meetings where mentor_id = ?', [meetingData.mentor_id],  (err, results) => {
                if (err) {
                    return callback(err, null);
                }
                callback(null, results);
            });
        });
    },

    updateMeetingById: (meetingId, newData, callback) => {
        db.query('UPDATE meetings SET ? WHERE meeting_id = ?', [newData, meetingId], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result.affectedRows > 0);
        });
    },

    getMeetingsByMentorId: (mentorId, callback) => {
        const query = 'SELECT * FROM meetings WHERE mentor_id = ?';
        db.query(query, [mentorId], (err, results) => {
            if (err) {
                return callback(err, null);
            }

            const meetingPromises = results.map(meeting => {
                if (meeting.confirmation) {
                    return new Promise((resolve, reject) => {
                        const confirmedStudents = meeting.confirmation.split(',').map(id => id.trim());
                        const studentQuery = 'SELECT * FROM students WHERE student_id IN (?)';
                        db.query(studentQuery, [confirmedStudents], (err, studentResults) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            meeting.confirmed_students = studentResults;
                            resolve(meeting);
                        });
                    });
                } else {
                    return new Promise((resolve) => {
                        meeting.confirmed_students = [];
                        resolve(meeting);
                    });
                }
            });

            Promise.all(meetingPromises)
                .then(meetings => {
                    callback(null, meetings);
                })
                .catch(err => {
                    callback(err, null);
                });
        });
    },

    getMeetingsByStudentIds: (studentIds, callback) => {
        const placeholders = studentIds.map(() => 'FIND_IN_SET(?, student_ids)').join(' OR ');
        const query = `
            SELECT m.*, mentor.*
            FROM meetings m
            JOIN mentors mentor ON m.mentor_id = mentor.mentor_id
            WHERE ${placeholders}
        `;
    
        db.query(query, studentIds, (err, results) => {
            if (err) {
                return callback(err, null);
            }
    
            const meetings = results.map(result => ({
                ...result,
                mentor: {
                    mentor_id: result.mentor_id,
                    honorifics: result.honorifics,
                    fname: result.fname,
                    lname: result.lname,
                    email: result.email,
                    phone: result.phone
                }
            }));
    
            callback(null, meetings);
        });
    },

    deleteMeetingById: (meetingId, callback) => {
        db.query('DELETE FROM meetings WHERE meeting_id = ?', [meetingId], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result.affectedRows > 0);
        });
    },

    updateFeedbackById: (meetingId, newFeedback, callback) => {
        db.query('UPDATE meetings SET feedback = ? WHERE meeting_id = ?', [newFeedback, meetingId], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result.affectedRows > 0);
        });
    },

    updateMeetingConfirmation: (meetingId, studentId, callback) => {
        db.query('SELECT confirmation FROM meetings WHERE meeting_id = ?', [meetingId], (err, results) => {
            if (err) {
                return callback(err);
            }
            if (results.length === 0) {
                return callback(null, false); // Meeting not found
            }
            const currentConfirmation = results[0].confirmation || '';
            const newConfirmation = currentConfirmation ? currentConfirmation + ',' + studentId : studentId;
            db.query('UPDATE meetings SET confirmation = ? WHERE meeting_id = ?', [newConfirmation, meetingId], (err, result) => {
                if (err) {
                    return callback(err);
                }
                callback(null, result.affectedRows > 0);
            });
        });
    },

    updateMeetingApprove: (meetingId, callback) => {
        const query = 'UPDATE meetings SET approve = ? WHERE meeting_id = ?';
        db.query(query, [true, meetingId], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result.affectedRows > 0);
        });
    },
};

module.exports = meetingModel;
