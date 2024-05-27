const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/all', authMiddleware, meetingController.getAllMeetings);
router.post('/add', authMiddleware, meetingController.addMeeting);
router.put('/:meetingId', authMiddleware, meetingController.updateMeetingById);
router.get('/mentor/:mentorId', authMiddleware, meetingController.getMeetingsByMentorId);
router.get('/extended', authMiddleware, meetingController.getFullMeetingDetails);
router.get('/full/mentor/:mentorId', authMiddleware, meetingController.getFullMeetingDetailbyMentor);
router.get('/students/:studentIds', authMiddleware, meetingController.getMeetingsByStudentIds);

router.put('/:meetingId/:mentorId/approve', authMiddleware, meetingController.updateMeetingApprove);

router.patch('/feedback/:meetingId', authMiddleware, meetingController.updateFeedbackById);
router.patch('/accept', authMiddleware, meetingController.acceptMeeting);

router.delete('/:meetingId', authMiddleware, meetingController.deleteMeetingById);

module.exports = router;
