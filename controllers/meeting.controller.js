const meetingModel = require('../models/meeting.model');
const mentorModel = require('../models/mentor.model');
const studentModel = require('../models/student.model');

const meetingController = {
    getAllMeetings: (req, res) => {
        meetingModel.getAllMeetings((err, meetings) => {
            if (err) {
                console.error('Error fetching meetings:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ success: true, meetings });
        });
    },

    addMeeting: (req, res) => {
        let meetingData = req.body;
        meetingData.student_ids = req.body.student_ids.join(",");
        meetingModel.addMeeting(meetingData, (err, meetings) => {
            if (err) {
                console.error('Error adding meeting:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(201).json({ success: true, message: 'Meeting added successfully', meetings });
        });
    },

    updateMeetingById: (req, res) => {
        const meetingId = req.params.meetingId;
        const newData = req.body;
        meetingModel.updateMeetingById(meetingId, newData, (err, success) => {
            if (err) {
                console.error('Error updating meeting:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (!success) {
                res.status(404).json({ error: 'Meeting not found' });
                return;
            }
            res.status(200).json({ success: true, message: 'Meeting updated successfully' });
        });
    },

    getMeetingsByMentorId: (req, res) => {
        const mentorId = req.params.mentorId;
        meetingModel.getMeetingsByMentorId(mentorId, (err, meetings) => {
            if (err) {
                console.error('Error fetching meetings by mentor_id:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ success: true, meetings });
        });
    },

    getFullMeetingDetails: (req, res) => {
        meetingModel.getAllMeetings((err, meetings) => {
            if (err) {
                console.error('Error fetching all meetings:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            // Fetch mentor and student details for each meeting
            const meetingPromises = meetings.map(meeting => {
                return new Promise((resolve, reject) => {
                    // Fetch mentor details
                    mentorModel.getMentorById(meeting.mentor_id, (err, mentor) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        // Fetch student details
                        const studentIds = meeting.student_ids.split(',').map(id => id.trim());
                        studentModel.getStudentsByIds(studentIds, (err, students) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            // Resolve with constructed meeting object
                            const meetingDetails = {
                                meeting_id: meeting.meeting_id,
                                title: meeting.title,
                                description: meeting.description,
                                date: meeting.date,
                                time: meeting.time,
                                feedback: meeting.feedback,
                                mentor_name: mentor ? `${mentor.honorifics} ${mentor.fname} ${mentor.lname}` : 'Unknown Mentor',
                                attended_student_names: students.map(student => `${student.fname} ${student.lname}`).join(', ')
                            };
                            resolve(meetingDetails);
                        });
                    });
                });
            });

            // Wait for all promises to resolve and send the response
            Promise.all(meetingPromises)
                .then(meetingDetails => {
                    res.status(200).json({ success: true, meetings: meetingDetails });
                })
                .catch(err => {
                    console.error('Error fetching meeting details:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                });
        });
    },   

    getFullMeetingDetailbyMentor: (req, res) => {
        const mentorId = req.params.mentorId;
        meetingModel.getMeetingsByMentorId(mentorId, (err, meetings) => {
            if (err) {
                console.error('Error fetching meetings by mentor_id:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            // Fetch mentor and student details for each meeting
            const meetingPromises = meetings.map(meeting => {
                return new Promise((resolve, reject) => {
                    // Fetch mentor details
                    mentorModel.getMentorById(meeting.mentor_id, (err, mentor) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        // Fetch student details
                        const studentIds = meeting.student_ids.split(',').map(id => id.trim());
                        studentModel.getStudentsByIds(studentIds, (err, students) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            // Resolve with constructed meeting object
                            const meetingDetails = {
                                meeting_id: meeting.meeting_id,
                                title: meeting.title,
                                description: meeting.description,
                                date: meeting.date,
                                time: meeting.time,
                                feedback: meeting.feedback,
                                mentor_name: mentor ? `${mentor.honorifics} ${mentor.fname} ${mentor.lname}` : 'Unknown Mentor',
                                attended_student_names: students.map(student => `${student.fname} ${student.lname}`).join(', ')
                            };
                            resolve(meetingDetails);
                        });
                    });
                });
            });

            // Wait for all promises to resolve and send the response
            Promise.all(meetingPromises)
                .then(meetingDetails => {
                    res.status(200).json({ success: true, meetings: meetingDetails });
                })
                .catch(err => {
                    console.error('Error fetching meeting details:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                });
        });
    },

    getMeetingsByStudentIds: (req, res) => {
        const studentIds = req.params.studentIds;
        meetingModel.getMeetingsByStudentIds(studentIds, (err, meetings) => {
            if (err) {
                console.error('Error fetching meetings by student_ids:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ success: true, meetings });
        });
    },

    deleteMeetingById: (req, res) => {
        const meetingId = req.params.meetingId;
        meetingModel.deleteMeetingById(meetingId, (err, success) => {
            if (err) {
                console.error('Error deleting meeting:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (!success) {
                res.status(404).json({ error: 'Meeting not found' });
                return;
            }
            res.status(200).json({ success: true, message: 'Meeting deleted successfully' });
        });
    },

    updateFeedbackById: (req, res) => {
        const meetingId = req.params.meetingId;
        const newFeedback = req.body.feedback;
        meetingModel.updateFeedbackById(meetingId, newFeedback, (err, success) => {
            if (err) {
                console.error('Error updating feedback for meeting:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (!success) {
                res.status(404).json({ error: 'Meeting not found' });
                return;
            }
            res.status(200).json({ success: true, message: 'Feedback updated successfully' });
        });
    },

    acceptMeeting: (req, res) => {
        const { meeting_id, student_id } = req.body;
        meetingModel.updateMeetingConfirmation(meeting_id, student_id, (err, success) => {
            if (err) {
                console.error('Error accepting meeting:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (!success) {
                res.status(404).json({ error: 'Meeting not found' });
                return;
            }
            res.status(200).json({ success: true, message: 'Meeting accepted successfully' });
        });
    },

    updateMeetingApprove: (req, res) => {
        const mentorId = req.params.mentorId;
        const meetingId = req.params.meetingId;
        meetingModel.updateMeetingApprove(meetingId, (err, success) => {
            if (err) {
                console.error('Error updating meeting approve status:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (!success) {
                res.status(404).json({ error: 'Meeting not found or already approved' });
                return;
            }
            // After updating the meeting, fetch the list of meetings by mentorId
            meetingModel.getMeetingsByMentorId(mentorId, (err, meetings) => {
                if (err) {
                    console.error('Error fetching meetings by mentor_id:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
                res.status(200).json({ success: true, meetings });
            });
        });
    }
};

module.exports = meetingController;
