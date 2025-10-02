const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

router.post('/generate', timetableController.generateTimetable);
router.post('/save', timetableController.saveTimetable);
router.get('/load-last', timetableController.loadLastTimetable);
router.get('/load-locked', timetableController.loadLastLockedTimetable);
router.get('/solutions', timetableController.getAllSolutions);
router.get('/load/:id', timetableController.loadSpecificTimetable);
router.post('/lock/:id', timetableController.toggleLockStatus);

module.exports = router;