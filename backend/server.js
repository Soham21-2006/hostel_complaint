const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Complaint = require('./models/Complaint');

const app = express();

// Middleware
app.use(cors({
    origin: "https://hostel-complaint-theta.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
app.use(express.static('frontend'));

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
console.log('Connecting to MongoDB...');

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    
    // Create default admin if not exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new User({
            name: 'Administrator',
            email: 'admin@hostel.com',
            password: hashedPassword,
            rollNumber: 'ADMIN001',
            roomNumber: 'ADMIN',
            phone: '0000000000',
            role: 'admin'
        });
        await admin.save();
        console.log('✅ Default admin created - Username: admin@hostel.com, Password: admin123');
    }
}).catch(err => console.error('❌ MongoDB connection error:', err));

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// ============ API ROUTES ============

// Student Registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, rollNumber, roomNumber, phone } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { rollNumber }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Email or Roll Number already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name, email, password: hashedPassword, rollNumber, roomNumber, phone, role: 'student'
        });
        
        await user.save();
        res.status(201).json({ message: 'Registration successful! Please login.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        if (user.role !== role) {
            return res.status(401).json({ error: `You are not registered as a ${role}` });
        }
        
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.name, roomNumber: user.roomNumber },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roomNumber: user.roomNumber,
                rollNumber: user.rollNumber
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit Complaint (Student)
app.post('/api/complaints', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can submit complaints' });
        }
        
        const { category, description } = req.body;
        const complaint = new Complaint({
            studentId: req.user.id,
            studentName: req.user.name,
            roomNumber: req.user.roomNumber,
            category,
            description
        });
        
        await complaint.save();
        res.status(201).json({ message: 'Complaint submitted successfully', complaint });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Student's Complaints
app.get('/api/my-complaints', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const complaints = await Complaint.find({ studentId: req.user.id }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Complaints (Admin)
app.get('/api/all-complaints', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Complaint Status (Admin)
app.put('/api/complaints/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { status, adminRemark } = req.body;
        const updateData = { status, adminRemark };
        
        if (status === 'Resolved') {
            updateData.resolvedAt = new Date();
        }
        
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        
        res.json({ message: 'Complaint updated successfully', complaint });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Statistics (Admin)
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const totalComplaints = await Complaint.countDocuments();
        const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });
        const inProgressComplaints = await Complaint.countDocuments({ status: 'In Progress' });
        const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
        const totalStudents = await User.countDocuments({ role: 'student' });
        
        res.json({
            totalComplaints,
            pendingComplaints,
            inProgressComplaints,
            resolvedComplaints,
            totalStudents
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
