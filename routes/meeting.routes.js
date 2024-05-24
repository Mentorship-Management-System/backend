const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting.controller');

router.get('/all', meetingController.getAllMeetings);
router.post('/add', meetingController.addMeeting);
router.put('/:meetingId', meetingController.updateMeetingById);
router.get('/mentor/:mentorId', meetingController.getMeetingsByMentorId);
router.get('/extended', meetingController.getFullMeetingDetails);
router.get('/full/mentor/:mentorId', meetingController.getFullMeetingDetailbyMentor);
router.get('/students/:studentIds', meetingController.getMeetingsByStudentIds);

router.put('/:meetingId/:mentorId/approve', meetingController.updateMeetingApprove);

router.patch('/feedback/:meetingId', meetingController.updateFeedbackById);
router.patch('/accept', meetingController.acceptMeeting);

router.delete('/:meetingId', meetingController.deleteMeetingById);

module.exports = router;
