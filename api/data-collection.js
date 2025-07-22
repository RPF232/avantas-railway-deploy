const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { sendPremiumWelcome } = require('./email-service');

// Data storage files
const USER_DATA_FILE = path.join(__dirname, '../data/user-data.json');
const COMMENTS_FILE = path.join(__dirname, '../data/comments.json');
const LOGIN_ATTEMPTS_FILE = path.join(__dirname, '../data/login-attempts.json');

// Initialize data files if they don't exist
async function initializeDataFiles() {
    const files = [
        { path: USER_DATA_FILE, defaultData: { users: [] } },
        { path: COMMENTS_FILE, defaultData: { comments: [] } },
        { path: LOGIN_ATTEMPTS_FILE, defaultData: { attempts: [] } }
    ];

    for (const file of files) {
        try {
            await fs.access(file.path);
        } catch {
            await fs.writeFile(file.path, JSON.stringify(file.defaultData, null, 2));
        }
    }
}

initializeDataFiles();

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper function to read data from file
async function readDataFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return null;
    }
}

// Helper function to write data to file
async function writeDataFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        return false;
    }
}



// Comment submission endpoint
router.post('/comment', async (req, res) => {
    try {
        const { name, email, website, comment, postId } = req.body;

        // Validate required fields
        if (!name || !email || !comment) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, and comment are required'
            });
        }

        // Validate email
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address'
            });
        }

        // Read current comments
        const data = await readDataFile(COMMENTS_FILE);
        if (!data) {
            return res.status(500).json({
                success: false,
                error: 'Failed to process comment'
            });
        }

        // Add new comment
        const newComment = {
            id: Date.now().toString(),
            name,
            email,
            website: website || '',
            comment,
            postId: postId || 'general',
            timestamp: new Date().toISOString(),
            status: 'pending' // For moderation
        };

        data.comments.push(newComment);

        // Save updated data
        const saved = await writeDataFile(COMMENTS_FILE, data);
        if (!saved) {
            return res.status(500).json({
                success: false,
                error: 'Failed to save comment'
            });
        }

        // Log the comment
        console.log('New comment submitted:', newComment);

        res.json({
            success: true,
            message: 'Your comment has been submitted and is awaiting moderation.'
        });

    } catch (error) {
        console.error('Comment submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit comment. Please try again later.'
        });
    }
});

// Login attempt tracking endpoint
router.post('/login-attempt', async (req, res) => {
    try {
        const { email, success, ipAddress, userAgent } = req.body;

        // Read current login attempts
        const data = await readDataFile(LOGIN_ATTEMPTS_FILE);
        if (!data) {
            return res.status(500).json({
                success: false,
                error: 'Failed to track login attempt'
            });
        }

        // Add new login attempt
        const newAttempt = {
            id: Date.now().toString(),
            email,
            success: success || false,
            ipAddress: ipAddress || req.ip,
            userAgent: userAgent || req.get('User-Agent'),
            timestamp: new Date().toISOString()
        };

        data.attempts.push(newAttempt);

        // Keep only last 1000 attempts to prevent file from growing too large
        if (data.attempts.length > 1000) {
            data.attempts = data.attempts.slice(-1000);
        }

        // Save updated data
        const saved = await writeDataFile(LOGIN_ATTEMPTS_FILE, data);
        if (!saved) {
            console.error('Failed to save login attempt');
        }

        // Log the attempt
        console.log('Login attempt tracked:', newAttempt);

        res.json({
            success: true,
            message: 'Login attempt tracked'
        });

    } catch (error) {
        console.error('Login attempt tracking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track login attempt'
        });
    }
});

// Premium account signup endpoint
router.post('/premium-signup', async (req, res) => {
    try {
        const { email, plan, source } = req.body;

        // For premium signups, email can be empty as it will be collected during Stripe checkout
        // Only validate email if it's provided
        if (email && email.trim() !== '' && !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address'
            });
        }

        // Read current user data
        const data = await readDataFile(USER_DATA_FILE);
        if (!data) {
            return res.status(500).json({
                success: false,
                error: 'Failed to process signup'
            });
        }

        // For tracking purposes, we'll create a temporary entry if email is empty
        // The actual user will be created after successful payment
        if (email && email.trim() !== '') {
            // Check if user already exists
            const existingUser = data.users.find(user => user.email === email);
            
            if (existingUser) {
                // Update existing user's premium status
                existingUser.premiumSignups = existingUser.premiumSignups || [];
                existingUser.premiumSignups.push({
                    plan,
                    source,
                    timestamp: new Date().toISOString()
                });
            } else {
                // Create new user
                const newUser = {
                    id: Date.now().toString(),
                    email,
                    timestamp: new Date().toISOString(),
                    premiumSignups: [{
                        plan,
                        source,
                        timestamp: new Date().toISOString()
                    }]
                };
                data.users.push(newUser);
            }
        } else {
            // Create a tracking entry for anonymous signup attempts
            const anonymousEntry = {
                id: Date.now().toString(),
                email: 'pending', // Will be updated after payment
                timestamp: new Date().toISOString(),
                premiumSignups: [{
                    plan,
                    source,
                    timestamp: new Date().toISOString()
                }],
                anonymous: true
            };
            data.users.push(anonymousEntry);
        }

        // Save updated data
        const saved = await writeDataFile(USER_DATA_FILE, data);
        if (!saved) {
            return res.status(500).json({
                success: false,
                error: 'Failed to save signup'
            });
        }

        // Send welcome email (only if email is provided and valid)
        if (email && email.trim() !== '' && emailRegex.test(email)) {
            try {
                const emailResult = await sendPremiumWelcome(email, plan);
                if (!emailResult.success) {
                    console.warn('Failed to send premium welcome email:', emailResult.error);
                }
            } catch (emailError) {
                console.error('Email sending error:', emailError);
                // Don't fail the signup if email fails
            }
        }

        // Log the signup
        console.log('Premium signup:', { email, plan, source });

        res.json({
            success: true,
            message: 'Premium signup recorded successfully'
        });

    } catch (error) {
        console.error('Premium signup error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process signup. Please try again later.'
        });
    }
});

// Get all user data (for admin purposes)
router.get('/user-data', async (req, res) => {
    try {
        const userData = await readDataFile(USER_DATA_FILE);
        const comments = await readDataFile(COMMENTS_FILE);
        const loginAttempts = await readDataFile(LOGIN_ATTEMPTS_FILE);
        
        // Also get consultation requests and newsletter subscriptions
        const consultationRequests = await readDataFile(path.join(__dirname, '../data/consultation-requests.json'));
        const newsletterSubscribers = await readDataFile(path.join(__dirname, 'subscriptions.json'));

        res.json({
            success: true,
            data: {
                users: userData?.users || [],
                comments: comments?.comments || [],
                loginAttempts: loginAttempts?.attempts || [],
                consultationRequests: consultationRequests?.requests || [],
                newsletterSubscribers: newsletterSubscribers || []
            }
        });

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user data'
        });
    }
});

module.exports = router; 