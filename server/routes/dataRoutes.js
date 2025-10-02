const express = require('express');
const router = express.Router();
const { getAll, getOne, createItem, updateItem, deleteItem, loginUser } = require('../controllers/dataController');


const Teacher = require('../models/Teacher');
const Room = require('../models/Room');
const Course = require('../models/Course');
const Slot = require('../models/Slot');
const Group = require('../models/Group');
const User = require('../models/User'); 


router.get('/teachers', (req, res) => getAll(Teacher, req, res));
router.get('/teachers/:id', (req, res) => getOne(Teacher, req, res));
router.post('/teachers', (req, res) => createItem(Teacher, req, res));
router.put('/teachers/:id', (req, res) => updateItem(Teacher, req, res));
router.delete('/teachers/:id', (req, res) => deleteItem(Teacher, req, res));


router.get('/rooms', (req, res) => getAll(Room, req, res));
router.get('/rooms/:id', (req, res) => getOne(Room, req, res));
router.post('/rooms', (req, res) => createItem(Room, req, res));
router.put('/rooms/:id', (req, res) => updateItem(Room, req, res));
router.delete('/rooms/:id', (req, res) => deleteItem(Room, req, res));


router.get('/courses', (req, res) => getAll(Course, req, res));
router.get('/courses/:id', (req, res) => getOne(Course, req, res));
router.post('/courses', (req, res) => createItem(Course, req, res));
router.put('/courses/:id', (req, res) => updateItem(Course, req, res));
router.delete('/courses/:id', (req, res) => deleteItem(Course, req, res));


router.get('/slots', (req, res) => getAll(Slot, req, res));
router.get('/slots/:id', (req, res) => getOne(Slot, req, res));
router.post('/slots', (req, res) => createItem(Slot, req, res));
router.put('/slots/:id', (req, res) => updateItem(Slot, req, res));
router.delete('/slots/:id', (req, res) => deleteItem(Slot, req, res));


router.get('/groups', (req, res) => getAll(Group, req, res));
router.get('/groups/:id', (req, res) => getOne(Group, req, res));
router.post('/groups', (req, res) => createItem(Group, req, res));
router.put('/groups/:id', (req, res) => updateItem(Group, req, res));
router.delete('/groups/:id', (req, res) => deleteItem(Group, req, res));


router.get('/users', (req, res) => getAll(User, req, res));
router.get('/users/:id', (req, res) => getOne(User, req, res));
router.post('/users', (req, res) => createItem(User, req, res));
router.put('/users/:id', (req, res) => updateItem(User, req, res));
router.delete('/users/:id', (req, res) => deleteItem(User, req, res));


router.post('/auth/login', loginUser);

module.exports = router;