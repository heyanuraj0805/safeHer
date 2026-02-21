// ============================================
// Safety Alert Model
// ============================================

const mongoose = require('mongoose');

const safetyAlertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['sos', 'check-in', 'zone-alert', 'help-request', 'test'],
        required: true
    },
    severity: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'medium'
    },
    location: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        },
        address: String,
        accuracy: Number
    },
    status: {
        type: String,
        enum: ['triggered', 'acknowledged', 'resolved', 'cancelled'],
        default: 'triggered'
    },
    recipients: [{
        contactId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        phone: String,
        email: String,
        notificationSent: {
            type: Boolean,
            default: false
        },
        notificationMethod: {
            type: String,
            enum: ['sms', 'call', 'email', 'push', 'socket']
        },
        acknowledgedAt: Date
    }],
    message: {
        type: String,
        default: 'Emergency assistance needed'
    },
    media: [{
        type: {
            type: String,
            enum: ['audio', 'video', 'image']
        },
        url: String,
        timestamp: Date
    }],
    timeline: [{
        action: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: String
    }],
    resolution: {
        resolvedAt: Date,
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    },
    metadata: {
        deviceType: String,
        appVersion: String,
        batteryLevel: Number,
        networkType: String
    }
}, {
    timestamps: true
});

// Index for efficient queries
safetyAlertSchema.index({ userId: 1, createdAt: -1 });
safetyAlertSchema.index({ status: 1 });
safetyAlertSchema.index({ type: 1 });

module.exports = mongoose.model('SafetyAlert', safetyAlertSchema);