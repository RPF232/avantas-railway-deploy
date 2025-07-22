const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();
const { exec } = require('child_process');

// Run the news update script on server start
exec('/Library/Frameworks/Python.framework/Versions/3.12/bin/python3 update_news.py', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error updating news: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`News update stderr: ${stderr}`);
    return;
  }
  console.log(`News update output: ${stdout}`);
});

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alpha-insights', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Middleware
app.use(cors());
app.use(express.json());

// Protect premium files from direct access
app.use('/assets/Tools', (req, res, next) => {
    res.status(403).json({ message: 'Access denied. Premium content requires authentication.' });
});

// Serve static files from root directory (excluding protected directories)
app.use(express.static('.', {
    setHeaders: (res, path) => {
        // Block access to premium tools directory
        if (path.includes('/assets/Tools/')) {
            res.status(403).send('Access denied');
        }
    }
}));

// Secure download endpoint for premium files
app.get('/api/download/:filename', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = mongoose.model('User');
        const user = await User.findById(decoded.userId);

        if (!user || !user.isPremium) {
            return res.status(403).json({ message: 'Premium account required' });
        }

        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'assets', 'Tools', filename);
        
        // Validate filename to prevent directory traversal
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return res.status(400).json({ message: 'Invalid filename' });
        }

        res.download(filePath, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(404).json({ message: 'File not found' });
            }
        });
    } catch (error) {
        console.error('Download endpoint error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// API Routes
const subscribeRouter = require('./api/subscribe');
const consultationRouter = require('./api/consultation');
const authRouter = require('./api/auth');
const stripeRouter = require('./api/stripe');
const dataCollectionRouter = require('./api/data-collection');

app.use('/api', subscribeRouter);
app.use('/api/consultation', consultationRouter);
app.use('/api/auth', authRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/data', dataCollectionRouter);

// Trending News API Endpoint
app.get('/api/trending-news', async (req, res) => {
    const fs = require('fs').promises;
    const trendingNewsPath = path.join(__dirname, 'trending_news.json');
    try {
        const data = await fs.readFile(trendingNewsPath, 'utf8');
        const news = JSON.parse(data);
        res.json(news);
    } catch (err) {
        // If file doesn't exist or is empty, return an empty array
        res.json([]);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 