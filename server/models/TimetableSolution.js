const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now, required: true },
    solutionData: { type: Array, required: true },
    isLocked: { type: Boolean, default: false } 
});

module.exports = mongoose.model('TimetableSolution', solutionSchema, 'TimetableSolutions');