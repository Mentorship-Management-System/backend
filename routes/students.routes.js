const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/students.controllers');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', studentsController.loginUser);
// Protected routes
router.get('/all', authMiddleware, studentsController.getAllStudents);
router.get('/:rollno', authMiddleware, studentsController.getStudentById);
router.post('/add', authMiddleware, studentsController.addStudent);
router.post('/insert_students', studentsController.insertStudents);
router.put('/:rollno', authMiddleware, studentsController.updateStudent);
router.delete('/:rollno', authMiddleware, studentsController.deleteStudent);

module.exports = router;
