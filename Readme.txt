Thanks for downloading this template!

Template Name: ZenBlog
Template URL: https://bootstrapmade.com/zenblog-bootstrap-blog-template/
Author: BootstrapMade.com
License: https://bootstrapmade.com/license/

## AVANTAS Research Website

This is a customized version of the ZenBlog template for AVANTAS Research, featuring:

### Features
- **Automatic Email System**: Sends welcome emails for newsletter subscriptions, premium signups, and course registrations using IONOS SMTP
- **Premium Account Management**: Stripe integration for payments

- **Newsletter Subscription**: Email collection and management
- **Admin Dashboard**: Data visualization and user management
- **Consultation Booking**: Contact form with data collection

### Email Functionality
The website now includes automatic email sending using IONOS SMTP for:
1. **Newsletter Subscriptions**: Welcome email with benefits and premium upgrade CTA
2. **Premium Signups**: Welcome email with access details and feature links

4. **Payment Confirmations**: Welcome email sent after successful Stripe payments

### Setup Instructions
1. Install dependencies: `npm install` (includes nodemailer for SMTP)
2. Configure environment variables (see `email-config.md`)
3. Set up IONOS SMTP for email functionality
4. Start the server: `npm start`

### Email Configuration
See `email-config.md` for detailed setup instructions for the IONOS SMTP email system.

### Testing
Run `node test-email.js` to test the email functionality (update the test email address first).

### SMTP Configuration
The system uses IONOS SMTP with the following settings based on your provided configuration:
- **Host**: smtp.ionos.fr
- **Port**: 465 (TLS)
- **Security**: TLS/SSL encryption
- **Authentication**: Email username and password
