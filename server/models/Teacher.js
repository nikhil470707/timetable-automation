const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, 
    name: { type: String, required: true },
    qualified_courses: [{ type: String }],
    available_days: [{ type: String }],
    preferred_periods: [{ type: Number }]
});

module.exports = mongoose.model('Teacher', teacherSchema, 'teachers'); 

