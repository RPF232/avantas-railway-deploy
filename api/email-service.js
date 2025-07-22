const nodemailer = require('nodemailer');

// Create IONOS SMTP transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ionos.fr',
        port: process.env.SMTP_PORT || 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Email templates
const emailTemplates = {
    newsletter: {
        subject: 'Welcome to AVANTAS Research Newsletter!',
        html: (email) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2C2C2C; margin-bottom: 10px;">
                        <span style="font-size: 2em; font-weight: bold;">A</span><span style="font-size: 2em; font-weight: bold;">V</span>ANTAS Research
                    </h1>
                    <p style="color: #666; font-size: 18px;">Welcome to our exclusive newsletter!</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
                    <h2 style="color: #2C2C2C; margin-bottom: 15px;">Thank you for subscribing!</h2>
                    <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                        You're now part of our community of informed investors. You'll receive:
                    </p>
                    <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
                        <li>📊 In-depth market analysis and insights</li>
                        <li>🚨 Breaking news and market impact analysis</li>
                        <li>💡 Actionable trade ideas and strategies</li>
                        <li>📈 Weekly market summaries and trends</li>
                    </ul>
                </div>
                
                <div style="background: #2C2C2C; color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <h3 style="margin-bottom: 15px;">Ready to take your investing to the next level?</h3>
                    <p style="margin-bottom: 20px;">Upgrade to our Premium Account for exclusive access to advanced tools and personalized insights.</p>
                    <a href="https://avantas-research.com/premium-account.html" 
                       style="background: #fff; color: #2C2C2C; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                        Get Premium Access
                    </a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
                    <p>📍 237 Queen's Road Central, Sheung Wan, Hong Kong</p>
                    <p>📞 WhatsApp: +852 6336 8227 | 📧 contact@avantas-research.com</p>
                    <p style="margin-top: 15px;">
                        <a href="https://avantas-research.com/newsletter.html?unsubscribe=${encodeURIComponent(email)}" 
                           style="color: #999; text-decoration: none;">Unsubscribe</a>
                    </p>
                </div>
            </div>
        `
    },
    
    premium: {
        subject: 'Welcome to AVANTAS Research Premium!',
        html: (email, plan) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2C2C2C; margin-bottom: 10px;">
                        <span style="font-size: 2em; font-weight: bold;">A</span><span style="font-size: 2em; font-weight: bold;">V</span>ANTAS Research
                    </h1>
                    <p style="color: #666; font-size: 18px;">Premium Account Activated</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
                    <h2 style="color: #2C2C2C; margin-bottom: 15px;">🎉 Welcome to Premium!</h2>
                    <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                        Your premium account has been successfully activated. You now have access to:
                    </p>
                    <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
                        <li>💼 Exclusive Trade Ideas and Analysis</li>
                        <li>🛠️ Premium Tools & Resources</li>
                        <li>📞 Periodic Strategy Calls</li>
                        <li>💬 Live Chat with Investors & Analysts</li>
                        <li>📊 Advanced Market Insights</li>
                    </ul>
                </div>
                
                <div style="background: #2C2C2C; color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <h3 style="margin-bottom: 15px;">Start Exploring Your Premium Features</h3>
                    <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; margin-top: 20px;">
                        <a href="https://avantas-research.com/trade-ideas.html" 
                           style="background: #fff; color: #2C2C2C; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-weight: bold;">
                            Trade Ideas
                        </a>
                        <a href="https://avantas-research.com/tools.html" 
                           style="background: #fff; color: #2C2C2C; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-weight: bold;">
                            Premium Tools
                        </a>
                    </div>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
                    <p>📍 237 Queen's Road Central, Sheung Wan, Hong Kong</p>
                    <p>📞 WhatsApp: +852 6336 8227 | 📧 contact@avantas-research.com</p>
                    <p style="margin-top: 15px;">Need help? Reply to this email for support.</p>
                </div>
            </div>
        `
    },
    


    passwordReset: {
        subject: 'Your Password Reset Link for AVANTAS Research',
        html: (email, { resetLink }) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2C2C2C;">Password Reset Request</h2>
                <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
                <p>Please click on the button below to reset your password:</p>
                <a href="${resetLink}" style="background-color: #2C2C2C; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Your Password</a>
                <p style="margin-top: 20px;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
                <p>This link is valid for one hour.</p>
            </div>
        `
    },

    passwordResetSuccess: {
        subject: 'Your Password Has Been Changed',
        html: (email) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2C2C2C;">Password Changed Successfully</h2>
                <p>This is a confirmation that the password for your account with the email ${email} has just been changed.</p>
                <p>If you did not make this change, please contact our support team immediately.</p>
            </div>
        `
    },
    consultationConfirmation: {
        subject: 'Your Consultation Request Has Been Received',
        html: (email, data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2C2C2C; margin-bottom: 10px;">
                        <span style="font-size: 2em; font-weight: bold;">A</span><span style="font-size: 2em; font-weight: bold;">V</span>ANTAS Research
                    </h1>
                    <p style="color: #666; font-size: 18px;">Consultation Booking Confirmation</p>
                </div>
                <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
                    <h2 style="color: #2C2C2C; margin-bottom: 15px;">Thank you for booking a consultation!</h2>
                    <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                        Your consultation booking has been taken into account. We will send you another email shortly with meeting details.<br><br>
                        <strong>Summary of your request:</strong><br>
                        Name: ${data.name}<br>
                        Email: ${email}<br>
                        Type: ${data.consultationType}<br>
                        Date: ${data.preferredDate || 'N/A'}<br>
                        Time: ${data.preferredTime || 'N/A'}<br>
                        Notes: ${data.notes || 'None'}
                    </p>
                </div>
                <div style="background: #2C2C2C; color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <p style="margin-bottom: 0;">If you have any questions, reply to this email or contact us at contact@avantas-research.com</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
                    <p>📍 237 Queen's Road Central, Sheung Wan, Hong Kong</p>
                    <p>📞 WhatsApp: +852 6336 8227 | 📧 contact@avantas-research.com</p>
                </div>
            </div>
        `
    }
};

// Email sending functions
const sendEmail = async (to, template, data = {}) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('SMTP credentials not configured. Email not sent.');
            return { success: false, error: 'Email service not configured' };
        }

        const templateData = emailTemplates[template];
        if (!templateData) {
            throw new Error(`Email template '${template}' not found`);
        }

        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.FROM_EMAIL || process.env.SMTP_USER,
            to: to,
            subject: templateData.subject,
            html: templateData.html(to, data)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to} (${template}) - Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

// Specific email functions
const sendNewsletterWelcome = async (email) => {
    return await sendEmail(email, 'newsletter');
};

const sendPremiumWelcome = async (email, plan) => {
    return await sendEmail(email, 'premium', { plan });
};

const sendConsultationConfirmation = async (email, data) => {
    return await sendEmail(email, 'consultationConfirmation', data);
};


module.exports = {
    sendEmail,
    sendNewsletterWelcome,
    sendPremiumWelcome,
    sendConsultationConfirmation
}; 