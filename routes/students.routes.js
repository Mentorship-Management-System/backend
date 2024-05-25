const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/students.controllers');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', studentsController.loginUser);
router.post('/generate', studentsController.generate);

router.get('/all', authMiddleware, studentsController.getAllStudents);
router.get('/mentor/:mentorId', studentsController.getStudentsByMentorId);
router.post('/add', authMiddleware, studentsController.addStudent);
router.post('/insert_students', studentsController.insertStudents);
router.post('/search', authMiddleware, studentsController.searchStudents);
router.get('/available-mentees', authMiddleware, studentsController.getAvailableMentees);
router.post('/assign-mentees', authMiddleware, studentsController.assignMenteesToMentor);

router.get('/mentor/:mentorIndex', authMiddleware, studentsController.getStudentsByMentorIndex);
router.get('/:rollno', authMiddleware, studentsController.getStudentById);
router.put('/:rollno', authMiddleware, studentsController.updateStudent);
router.delete('/:rollno', authMiddleware, studentsController.deleteStudent);
router.get('/:enrollmentNo/with-mentor', authMiddleware, studentsController.getStudentWithMentorDetails);


module.exports = router;
