const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentors.controller');

const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', mentorController.loginMentor);
// Protected routes
router.get('/all', authMiddleware, mentorController.getAllMentors);
router.get('/:mentorId', authMiddleware, mentorController.getMentorById);
router.post('/add', authMiddleware, mentorController.addMentor);
router.put('/update/:mentorId', authMiddleware, mentorController.updateMentor);
router.delete('/delete/:mentorId', authMiddleware, mentorController.deleteMentor);
router.post('/insert', authMiddleware, mentorController.insertMentors);

module.exports = router;
