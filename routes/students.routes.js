const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/students.controllers');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', studentsController.loginUser);
router.post('/generate', studentsController.generate);

router.get('/all', authMiddleware, studentsController.getAllStudents);
router.get('/mentor/:mentorId', studentsController.getStudentsByMentorId);
router.get('/count-by-year/:mentorId', authMiddleware, studentsController.getStudentCountByEnrollmentYear);
router.get('/all-count-by-year', studentsController.getAllStudentsCountByYear);
router.get('/year/gender-count', studentsController.getGenderCountByEnrollmentYear);

router.post('/add', authMiddleware, studentsController.addStudent);
router.post('/insert_students', studentsController.insertStudents);
router.post('/search', authMiddleware, studentsController.searchStudents);
router.get('/available-mentees', authMiddleware, studentsController.getAvailableMentees);
router.get('/sgpa/:enrollment_no', studentsController.getSgpasByEnrollmentNo);
router.post('/assign-mentees', authMiddleware, studentsController.assignMenteesToMentor);

router.post('/saveSemesterDetails', authMiddleware, studentsController.saveSemesterDetails);
router.post('/save-sgpa', authMiddleware, studentsController.saveSgpa);
router.post('/upload-students', authMiddleware, studentsController.insertStudentCredentials);

router.get('/mentor/:mentorIndex', authMiddleware, studentsController.getStudentsByMentorIndex);
router.get('/:rollno', authMiddleware, studentsController.getStudentById);
router.put('/:rollno', authMiddleware, studentsController.updateStudent);
router.delete('/delete/:rollno', authMiddleware, studentsController.deleteStudent);
router.delete('/delete-students-profile', authMiddleware, studentsController.deleteStudentsProfile);
router.get('/:enrollmentNo/with-mentor', authMiddleware, studentsController.getStudentWithMentorDetails);


module.exports = router;
