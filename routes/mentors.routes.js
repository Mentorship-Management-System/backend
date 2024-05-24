const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentors.controller');

const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', mentorController.loginMentor);
// Protected routes
router.get('/all', authMiddleware, mentorController.getAllMentors);
router.get('/with-mentees', authMiddleware, mentorController.getAllMentorsWithMentees);
// router.get('/allocate/mentees', authMiddleware, mentorController.allocateMentees);
router.get('/:mentorId', authMiddleware, mentorController.getMentorById);
router.get('/:mentorIndex/mentees', authMiddleware, mentorController.getMenteesByMentorIndex);

router.post('/add', authMiddleware, mentorController.addMentor);
router.put('/update/:mentorId', authMiddleware, mentorController.updateMentor);
router.delete('/delete/:mentorId', authMiddleware, mentorController.deleteMentor);
router.post('/insert', authMiddleware, mentorController.insertMentors);

router.patch('/:mentorId/updateAvailability', mentorController.updateMentorAvailability);

module.exports = router;
