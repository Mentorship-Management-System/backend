const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admins.controller');

const authMiddleware = require('../middleware/authMiddleware');

//get routes
router.get('/all', authMiddleware, adminController.getAllAdmins);
router.get('/allocate', authMiddleware, adminController.allocateMentorsToStudents);
router.get('/counts', authMiddleware, adminController.getCounts);
router.post('/reset-password', authMiddleware, adminController.resetPassword);

//post routes
router.post('/login', adminController.loginAdmin);
router.post('/generate', adminController.generate);

module.exports = router;
