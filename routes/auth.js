// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
const express = require('express');
const router = express.Router(); // <--- This is what's missing!

// ... then your existing code ...
router.post('/login', async (req, res) => {
    // login logic
});

module.exports = router;

module.exports = router;
router.post('/login', async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        // Find user by email or phone
        const query = email ? { email } : { phone };
        const user = await User.findOne(query).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, profileImage, settings } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (profileImage) updateData.profileImage = profileImage;
        if (settings) updateData.settings = { ...req.user.settings, ...settings };

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
});

// @route   PUT /api/auth/emergency-contacts
// @desc    Update emergency contacts
// @access  Private
router.put('/emergency-contacts', authenticateToken, async (req, res) => {
    try {
        const { contacts } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { emergencyContacts: contacts },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Emergency contacts updated',
            data: user.emergencyContacts
        });
    } catch (error) {
        console.error('Emergency contacts update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update emergency contacts',
            error: error.message
        });
    }
});

// @route   POST /api/auth/change-password
// @desc    Change password
// @access  Private
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
});

module.exports = router;