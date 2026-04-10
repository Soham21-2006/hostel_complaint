const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    category: { 
        type: String, 
        enum: ['Electrical', 'Plumbing', 'Furniture', 'Cleaning', 'Internet', 'Other'],
        required: true 
    },
    description: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Pending' 
    },
    adminRemark: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date }
});

module.exports = mongoose.model('Complaint', complaintSchema);
