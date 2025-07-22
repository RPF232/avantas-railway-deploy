const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const { sendEmail } = require('./email-service');

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isPremium: { type: Boolean, default: false },
    subscriptionDate: { type: Date },
    subscriptionEndDate: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
});

const User = mongoose.model('User', userSchema);

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, isPremium: user.isPremium },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, isPremium: user.isPremium });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// New endpoint to complete premium registration
router.post('/complete-premium-registration', async (req, res) => {
    try {
        const { sessionId, password } = req.body;

        if (!sessionId || !password) {
            return res.status(400).json({ message: 'Session ID and password are required.' });
        }

        // 1. Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // 2. Verify the payment was successful
        if (session.payment_status !== 'paid') {
            return res.status(400).json({ message: 'Payment for this session was not successful.' });
        }

        const email = session.customer_details.email;

        // 3. Check if a user with this email already exists
        let user = await User.findOne({ email });

        if (user) {
            // If user exists, update them to premium
            user.isPremium = true;
            user.subscriptionDate = new Date();
             // If you have subscription end logic, add it here
            user.subscriptionEndDate = null; // or calculate based on plan
        } else {
            // 4. If user doesn't exist, create a new one
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({
                email,
                password: hashedPassword,
                isPremium: true,
                subscriptionDate: new Date(),
            });
        }

        await user.save();

        res.status(200).json({ message: 'Premium account created successfully!' });

    } catch (error) {
        console.error('Premium registration completion error:', error);
        if (error.type === 'StripeInvalidRequestError') {
            return res.status(400).json({ message: 'Invalid session ID.' });
        }
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Endpoint to request a password reset
router.post('/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // Respond kindly even if user doesn't exist to prevent email enumeration
            return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        // Generate a token
        const token = crypto.randomBytes(20).toString('hex');

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // Send the email
        const resetLink = `http://${req.headers.host}/reset-password.html?token=${token}`;
        await sendEmail(user.email, 'passwordReset', { resetLink });

        res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });

    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint to reset the password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        // Set the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        // Send confirmation email
        await sendEmail(user.email, 'passwordResetSuccess');

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Verify premium status endpoint
router.get('/verify-premium', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ isPremium: user.isPremium });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router; 