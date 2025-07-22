require('dotenv').config();
const { sendNewsletterWelcome, sendPremiumWelcome } = require('./api/email-service');

async function testEmails() {
    console.log('Testing IONOS SMTP email functionality...\n');
    
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ SMTP not configured! Please set SMTP_USER and SMTP_PASS in your .env file');
        console.log('\nExample .env configuration:');
        console.log('SMTP_HOST=smtp.ionos.fr');
        console.log('SMTP_PORT=465');
        console.log('SMTP_USER=your_email@yourdomain.com');
        console.log('SMTP_PASS=your_email_password');
        console.log('FROM_EMAIL=noreply@yourdomain.com');
        return;
    }
    
    console.log('✅ SMTP Configuration found:');
    console.log(`   Host: ${process.env.SMTP_HOST || 'smtp.ionos.fr'}`);
    console.log(`   Port: ${process.env.SMTP_PORT || '465'}`);
    console.log(`   User: ${process.env.SMTP_USER}`);
    console.log(`   From: ${process.env.FROM_EMAIL || process.env.SMTP_USER}\n`);
    
    const testEmail = 'romain.pasquier.flaud@gmail.com'; // Replace with your test email
    
    console.log('📧 Starting email tests...\n');
    
    // Test newsletter welcome email
    console.log('1. Testing newsletter welcome email...');
    try {
        const result1 = await sendNewsletterWelcome(testEmail);
        if (result1.success) {
            console.log('✅ Newsletter email sent successfully!');
            console.log(`   Message ID: ${result1.messageId}`);
        } else {
            console.log('❌ Newsletter email failed:', result1.error);
        }
    } catch (error) {
        console.error('❌ Newsletter email error:', error.message);
    }
    
    console.log('\n2. Testing premium welcome email...');
    try {
        const result2 = await sendPremiumWelcome(testEmail, 'premium-package');
        if (result2.success) {
            console.log('✅ Premium email sent successfully!');
            console.log(`   Message ID: ${result2.messageId}`);
        } else {
            console.log('❌ Premium email failed:', result2.error);
        }
    } catch (error) {
        console.error('❌ Premium email error:', error.message);
    }
    

    
    console.log('\n🎉 Email testing completed!');
    console.log('\n💡 Tips:');
    console.log('   - Check your IONOS email account for sent emails');
    console.log('   - Check server logs for detailed error messages');
    console.log('   - Verify your SMTP credentials if emails fail');
    console.log('   - Update the test email address above to test with your real email');
}

// Run the test
testEmails().catch(console.error); 