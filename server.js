// ============================================
// SafeHer - Backend Server (Windows Compatible)
// ============================================

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// ============================================
// API Routes
// ============================================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'SafeHer Server is running'
    });
});

// Safety - Get Nearby Help
app.get('/api/safety/nearby', (req, res) => {
    const { lat, lng, type, radius = 5000 } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({
            success: false,
            message: 'Latitude and longitude are required'
        });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    const places = [
        {
            id: 1,
            name: 'Central Police Station',
            type: 'police',
            lat: userLat + 0.01,
            lng: userLng + 0.01,
            distance: 1.2,
            phone: '100',
            address: '123 Main Street'
        },
        {
            id: 2,
            name: 'North District Police Station',
            type: 'police',
            lat: userLat - 0.02,
            lng: userLng + 0.015,
            distance: 2.5,
            phone: '100',
            address: '456 North Avenue'
        },
        {
            id: 3,
            name: 'City General Hospital',
            type: 'hospital',
            lat: userLat + 0.02,
            lng: userLng - 0.01,
            distance: 2.5,
            phone: '108',
            address: '789 Health Road'
        },
        {
            id: 4,
            name: 'Women Helpline Center',
            type: 'helpline',
            lat: userLat + 0.005,
            lng: userLng + 0.008,
            distance: 0.8,
            phone: '1091',
            address: '321 Support Lane'
        }
    ];

    let filteredPlaces = places;
    if (type && type !== 'all') {
        filteredPlaces = places.filter(p => p.type === type);
    }

    res.json({
        success: true,
        data: filteredPlaces,
        count: filteredPlaces.length
    });
});

// Safety - Calculate Safety Score
app.get('/api/safety/score', (req, res) => {
    const hour = new Date().getHours();
    
    let score = 100;
    let status = 'Safe Zone';
    let color = '#00b894';
    let factors = [];

    if (hour >= 22 || hour < 5) {
        score -= 30;
        status = 'Caution: Late Night';
        color = '#fdcb6e';
        factors.push({ factor: 'Late Night Travel', impact: -30, severity: 'high' });
    } else if (hour >= 0 && hour < 6) {
        score -= 40;
        status = 'High Risk: Early Morning';
        color = '#d63031';
        factors.push({ factor: 'Early Morning Risk', impact: -40, severity: 'critical' });
    }

    factors.push({ factor: 'Police Nearby', impact: 5, severity: 'good' });
    factors.push({ factor: 'Well Lit Area', impact: 3, severity: 'good' });

    score = Math.max(0, Math.min(100, score));

    const recommendations = [];
    if (score < 60) {
        recommendations.push('Consider using SafeHer Journey Tracker');
        recommendations.push('Share your live location with trusted contacts');
    }
    if (hour >= 22 || hour < 5) {
        recommendations.push('Avoid isolated areas');
        recommendations.push('Use well-lit, busy routes');
    }
    recommendations.push('Trust your instincts - if something feels wrong, leave');

    res.json({
        success: true,
        data: { score, status, color, factors, recommendations }
    });
});

// SOS - Send Emergency Alert
app.post('/api/sos/send', (req, res) => {
    const { location, message } = req.body;

    if (!location || !location.lat || !location.lng) {
        return res.status(400).json({
            success: false,
            message: 'Location is required'
        });
    }

    io.emit('sos-triggered', {
        alertId: 'sos_' + Date.now(),
        location: location,
        message: message || 'EMERGENCY SOS activated!',
        timestamp: new Date().toISOString()
    });

    res.json({
        success: true,
        message: 'SOS alert sent successfully',
        data: { alertId: 'sos_' + Date.now() }
    });
});

// Journey - Start Journey
app.post('/api/journey/start', (req, res) => {
    const { destination } = req.body;
    
    res.json({
        success: true,
        message: 'Journey started successfully',
        data: { journeyId: 'journey_' + Date.now(), destination }
    });
});

// Journey - End Journey
app.post('/api/journey/end', (req, res) => {
    res.json({
        success: true,
        message: 'Journey completed successfully',
        data: { duration: '25 minutes', safetyScore: 92 }
    });
});

// Journey - Get History
app.get('/api/journey/history', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, destination: 'Office', distance: '5.2 km', safetyScore: 92 },
            { id: 2, destination: 'Home', distance: '5.8 km', safetyScore: 88 },
            { id: 3, destination: 'Shopping Mall', distance: '3.2 km', safetyScore: 95 }
        ]
    });
});

// Auth - Register
app.post('/api/auth/register', (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

    res.json({
        success: true,
        message: 'Registration successful',
        data: { user: { id: 'user_' + Date.now(), name, email, phone } }
    });
});

// Auth - Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    res.json({
        success: true,
        message: 'Login successful',
        data: { user: { id: 'user_123', name: 'Demo User', email }, token: 'token_' + Date.now() }
    });
});

// Auth - Get Profile
app.get('/api/auth/profile', (req, res) => {
    res.json({
        success: true,
        data: {
            id: 'user_123',
            name: 'Demo User',
            email: 'demo@safeher.com',
            phone: '+1234567890',
            emergencyContacts: [
                { id: 1, name: 'Mom', phone: '+1234567891', relationship: 'family' },
                { id: 2, name: 'Best Friend', phone: '+1234567892', relationship: 'friend' }
            ]
        }
    });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 SafeHer Server Started Successfully');
    console.log('========================================');
    console.log('📍 Server URL: http://localhost:' + PORT);
    console.log('🔗 API Health: http://localhost:' + PORT + '/api/health');
    console.log('📅 Started at: ' + new Date().toISOString());
    console.log('========================================');
});