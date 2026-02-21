// ============================================
// User Model
// ============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    profileImage: {
        type: String,
        default: ''
    },
    emergencyContacts: [{
        name: String,
        phone: String,
        email: String,
        relationship: {
            type: String,
            enum: ['family', 'friend', 'colleague', 'other']
        },
        priority: {
            type: Number,
            default: 1
        },
        isVerified: {
            type: Boolean,
            default: false
        }
    }],
    trustedCircle: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    settings: {
        autoSOS: {
            type: Boolean,
            default: false
        },
        backgroundTracking: {
            type: Boolean,
            default: true
        },
        fakePIN: {
            type: Boolean,
            default: false
        },
        notifications: {
            type: Boolean,
            default: true
        },
        soundAlerts: {
            type: Boolean,
            default: true
        }
    },
    locationHistory: [{
        lat: Number,
        lng: Number,
        timestamp: {
            type: Date,
            default: Date.now
        },
        accuracy: Number,
        activity: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    fcmToken: {
        type: String
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.locationHistory;
    return user;
};

module.exports = mongoose.model('User', userSchema);