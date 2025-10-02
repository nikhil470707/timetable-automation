const mongoose = require = require('mongoose');

const slotSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, 
    day: { type: String, required: true }, 
    period: { type: Number, required: true } 
});

module.exports = mongoose.model('Slot', slotSchema, 'slots');