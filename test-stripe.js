require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripeConnection() {
  try {
    console.log('Testing Stripe connection...');
    console.log('Using secret key:', process.env.STRIPE_SECRET_KEY ? '✅ Found' : '❌ Missing');
    
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not found in environment variables');
    }
    
    // Test 1: Check if we can create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Product',
              description: 'Test payment for verification.',
            },
            unit_amount: 1000, // $10.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel.html',
    });
    
    console.log('✅ Stripe connection successful!');
    console.log('✅ Checkout session created:', session.id);
    console.log('✅ Session URL:', session.url);
    
    // Test 2: Verify the session was created
    const retrievedSession = await stripe.checkout.sessions.retrieve(session.id);
    console.log('✅ Session retrieval successful:', retrievedSession.id === session.id);
    
    return true;
  } catch (error) {
    console.error('❌ Stripe test failed:', error.message);
    return false;
  }
}

// Run the test
testStripeConnection().then(success => {
  if (success) {
    console.log('\n🎉 Stripe integration is working correctly!');
  } else {
    console.log('\n💥 Stripe integration needs attention.');
  }
  process.exit(success ? 0 : 1);
}); 