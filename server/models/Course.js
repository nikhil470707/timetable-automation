const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, 
    course: { type: String, required: true }, 
    hours: { type: Number, required: true }, 
    group: { type: String, required: true }, 
    size: { type: Number, required: true } 
});

module.exports = mongoose.model('Course', courseSchema, 'courses');
