// ============================================
// Journey Model
// ============================================

const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    destination: {
        name: String,
        address: String,
        lat: Number,
        lng: Number
    },
    startLocation: {
        lat: Number,
        lng: Number,
        address: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    endLocation: {
        lat: Number,
        lng: Number,
        address: String,
        timestamp: Date
    },
    route: {
        type: {
            type: String,
            enum: ['safest', 'fastest', 'well-lit'],
            default: 'safest'
        },
        polyline: String,
        distance: Number, // in meters
        duration: Number // in seconds
    },
    checkpoints: [{
        name: String,
        lat: Number,
        lng: Number,
        timestamp: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'passed', 'skipped'],
            default: 'pending'
        },
        safetyScore: Number
    }],
    status: {
        type: String,
        enum: ['planned', 'in-progress', 'completed', 'cancelled', 'emergency'],
        default: 'planned'
    },
    safetyScore: {
        start: Number,
        end: Number,
        average: Number
    },
    timeline: [{
        event: {
            type: String,
            enum: ['started', 'checkpoint', 'pause', 'resume', 'completed', 'sos', 'help-requested']
        },
        location: {
            lat: Number,
            lng: Number
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: String
    }],
    sharedWith: [{
        contactId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        },
        shareDuration: Number, // in minutes, 0 = until arrival
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    notes: String,
    weather: {
        condition: String,
        temperature: Number,
        visibility: String
    }
}, {
    timestamps: true
});

// Index for efficient queries
journeySchema.index({ userId: 1, createdAt: -1 });
journeySchema.index({ status: 1 });

module.exports = mongoose.model('Journey', journeySchema);