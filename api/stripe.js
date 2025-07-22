const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendPremiumWelcome } = require('./email-service');

router.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Premium Package',
              description: 'One-off payment for premium access.',
            },
            unit_amount: 999, // $9.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/complete-registration.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel.html`,
      customer_email: req.body.email, // Pre-fill email if available
    });
    res.json({ id: session.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Endpoint to get session status and customer email
router.get('/session-status', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
        
        if (session.payment_status === 'paid') {
            res.json({
                status: session.status,
                payment_status: session.payment_status,
                customer_email: session.customer_details.email
            });
        } else {
            res.status(400).json({ error: 'Payment not successful' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Webhook to handle successful payments
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Send welcome email if customer email is available
      if (session.customer_details && session.customer_details.email) {
        try {
          const emailResult = await sendPremiumWelcome(session.customer_details.email, 'premium-package');
          if (emailResult.success) {
            console.log(`Welcome email sent to ${session.customer_details.email} after successful payment`);
          } else {
            console.warn('Failed to send welcome email after payment:', emailResult.error);
          }
        } catch (emailError) {
          console.error('Error sending welcome email after payment:', emailError);
        }
      }
      
      console.log('Payment completed successfully:', session.id);
      break;
      
    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', event.data.object.id);
      break;
      
    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object.id);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router; 