const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true },
    roomNumber: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, default: 'student' } // 'student' or 'admin'
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
