const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { sendNewsletterWelcome } = require('./email-service');

// Store subscriptions in a JSON file temporarily
const SUBSCRIPTIONS_FILE = path.join(__dirname, 'subscriptions.json');

// Initialize subscriptions file if it doesn't exist
async function initSubscriptionsFile() {
    try {
        await fs.access(SUBSCRIPTIONS_FILE);
    } catch {
        await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify([]));
    }
}

initSubscriptionsFile();

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address'
            });
        }

        // Read current subscriptions
        const subscriptionsData = await fs.readFile(SUBSCRIPTIONS_FILE, 'utf8');
        const subscriptions = JSON.parse(subscriptionsData);

        // Check if email already exists
        if (subscriptions.includes(email)) {
            return res.status(400).json({
                success: false,
                error: 'This email is already subscribed'
            });
        }

        // Add new subscription
        subscriptions.push(email);
        await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));

        // Send welcome email
        try {
            const emailResult = await sendNewsletterWelcome(email);
            if (!emailResult.success) {
                console.warn('Failed to send welcome email:', emailResult.error);
            }
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Don't fail the subscription if email fails
        }

        // Send success response
        res.json({
            success: true,
            message: 'Thank you for subscribing! You will receive our updates soon.'
        });

    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process subscription. Please try again later.'
        });
    }
});

module.exports = router; 