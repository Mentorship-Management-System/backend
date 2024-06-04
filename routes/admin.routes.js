const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admins.controller');

const authMiddleware = require('../middleware/authMiddleware');
const mentorController = require('../controllers/mentors.controller');

//get routes
router.get('/all', authMiddleware, adminController.getAllAdmins);
router.get('/admins/:adminId', authMiddleware, adminController.getAdminById);
router.get('/allocate', authMiddleware, adminController.allocateMentorsToStudents);
router.get('/counts', authMiddleware, adminController.getCounts);

router.put('/admins/:adminId', adminController.updateAdminById);

router.post('/reset-password', authMiddleware, adminController.resetPassword);
router.post('/forgot-password', adminController.frogotPassword);

router.post('/auto-allocate', authMiddleware, mentorController.allocateMentorsToStudents);
router.post('/manual-allocate', authMiddleware, mentorController.manualAllocateMentorsToStudents);

//post routes
router.post('/login', adminController.loginAdmin);
router.post('/generate', adminController.generate);
router.post('/register', authMiddleware, adminController.registerAdmin);

//delete routes
router.delete('/delete-admins-profile', authMiddleware, adminController.deleteAdminsProfile);

module.exports = router;
