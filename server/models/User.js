const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, 
    username: { type: String, required: true }, 
    password: { type: String, required: true }, 
    role: { type: String, required: true, enum: ['Admin', 'Teacher', 'Viewer'] } 
});

module.exports = mongoose.model('User', userSchema, 'users');