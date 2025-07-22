const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { sendConsultationConfirmation } = require('./email-service');

const dataFilePath = path.join(__dirname, '../data/consultation-requests.json');

// Validate date and time
const isValidDateTime = (date, time) => {
    const selectedDateTime = new Date(`${date}T${time}`);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Check if date is in the future
    if (selectedDateTime < tomorrow) {
        return false;
    }

    // Check if it's a weekend
    const day = selectedDateTime.getDay();
    if (day === 0 || day === 6) {
        return false;
    }

    // Check if time is within business hours (9 AM to 9 PM)
    const hour = selectedDateTime.getHours();
    const minutes = selectedDateTime.getMinutes();
    
    // Morning slots: 9:00 AM to 11:30 AM
    const isMorningSlot = (hour === 9 || hour === 10 || hour === 11) && (minutes === 0 || minutes === 30);
    
    // Afternoon slots: 2:00 PM to 4:30 PM
    const isAfternoonSlot = (hour === 14 || hour === 15 || hour === 16) && (minutes === 0 || minutes === 30);
    
    // Evening slots: 5:00 PM to 9:00 PM
    const isEveningSlot = (
        (hour >= 17 && hour <= 20) && (minutes === 0 || minutes === 30) || // 5:00 PM to 8:30 PM
        (hour === 21 && minutes === 0) // 9:00 PM
    );

    return isMorningSlot || isAfternoonSlot || isEveningSlot;
};

// Ensure the data directory exists
const ensureDataDirectory = async () => {
    const dataDir = path.dirname(dataFilePath);
    try {
        await fs.access(dataDir);
        console.log('Data directory exists:', dataDir);
    } catch (error) {
        console.log('Creating data directory:', dataDir);
        await fs.mkdir(dataDir, { recursive: true });
    }
};

// Initialize the JSON file if it doesn't exist
const initializeDataFile = async () => {
    try {
        await fs.access(dataFilePath);
        console.log('Data file exists:', dataFilePath);
    } catch (error) {
        console.log('Creating data file:', dataFilePath);
        await fs.writeFile(dataFilePath, JSON.stringify({ requests: [] }, null, 2));
    }
};

router.post('/book', async (req, res) => {
    try {
        const { name, email, phone, consultationType, preferredDate, preferredTime, notes } = req.body;

        // Validate date and time
        if (!isValidDateTime(preferredDate, preferredTime)) {
            return res.status(400).json({
                success: false,
                message: 'Please select a valid date and time (weekdays between 9 AM and 9 PM, starting from tomorrow)'
            });
        }
        
        // Create request object with timestamp
        const request = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            name,
            email,
            phone,
            consultationType,
            preferredDate,
            preferredTime,
            notes,
            status: 'pending' // Added status field for tracking
        };
        
        // Log the received data
        console.log('Received consultation request:', request);

        try {
            // Ensure data directory and file exist
            await ensureDataDirectory();
            await initializeDataFile();

            // Read existing data
            console.log('Reading existing data from:', dataFilePath);
            const fileData = await fs.readFile(dataFilePath, 'utf8');
            const data = JSON.parse(fileData);

            // Check for time slot conflicts
            const hasConflict = data.requests.some(existingRequest => 
                existingRequest.preferredDate === preferredDate && 
                existingRequest.preferredTime === preferredTime &&
                existingRequest.status !== 'cancelled'
            );

            if (hasConflict) {
                return res.status(400).json({
                    success: false,
                    message: 'This time slot is already booked. Please select a different time.'
                });
            }

            // Add new request
            data.requests.push(request);

            // Save updated data
            console.log('Saving updated data to file...');
            await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
            console.log('Data saved successfully');

            // Send confirmation email to user
            try {
                if (email) {
                    await sendConsultationConfirmation(email, request);
                    console.log('Consultation confirmation email sent to', email);
                }
            } catch (emailErr) {
                console.error('Failed to send consultation confirmation email:', emailErr);
                // Do not fail the booking if email fails
            }

        } catch (fileError) {
            console.error('Error handling data file:', fileError);
            throw fileError;
        }

        // Send success response
        res.status(200).json({ 
            success: true, 
            message: 'Your consultation request has been received. We will contact you shortly to confirm your appointment.' 
        });

    } catch (error) {
        console.error('Consultation booking error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'There was an error processing your request. Please try again or contact us directly.' 
        });
    }
});

// Get all consultation requests (optional, for admin purposes)
router.get('/requests', async (req, res) => {
    try {
        const fileData = await fs.readFile(dataFilePath, 'utf8');
        const data = JSON.parse(fileData);
        res.json(data);
    } catch (error) {
        console.error('Error reading consultation requests:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error retrieving consultation requests' 
        });
    }
});

module.exports = router; 