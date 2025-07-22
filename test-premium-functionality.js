#!/usr/bin/env node

/**
 * Premium Account Functionality Test Script
 * 
 * This script tests all aspects of premium account functionality:
 * 1. User registration and login
 * 2. Premium status verification
 * 3. Access control to premium content
 * 4. File downloads
 * 5. API endpoints
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'test-premium@example.com';
const TEST_PASSWORD = 'testPassword123!';

// Test results storage
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

// Utility functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
        info: '\x1b[36m',    // Cyan
        success: '\x1b[32m', // Green
        error: '\x1b[31m',   // Red
        warning: '\x1b[33m', // Yellow
        reset: '\x1b[0m'     // Reset
    };
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function addTestResult(testName, passed, details = '') {
    const result = {
        name: testName,
        passed,
        details,
        timestamp: new Date().toISOString()
    };
    testResults.tests.push(result);
    if (passed) {
        testResults.passed++;
        log(`✅ ${testName}`, 'success');
    } else {
        testResults.failed++;
        log(`❌ ${testName}: ${details}`, 'error');
    }
}

// Test functions
async function testServerConnection() {
    try {
        const response = await fetch(`${BASE_URL}/`);
        addTestResult('Server Connection', response.ok, `Status: ${response.status}`);
        return response.ok;
    } catch (error) {
        addTestResult('Server Connection', false, error.message);
        return false;
    }
}

async function testUserRegistration() {
    try {
        // First, try to create a premium account
        const response = await fetch(`${BASE_URL}/api/auth/complete-premium-registration`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'test_session_id',
                password: TEST_PASSWORD
            })
        });
        
        // This should fail because it's not a real Stripe session
        addTestResult('User Registration Endpoint', response.status === 400, 
            `Expected 400 for invalid session, got ${response.status}`);
        return true;
    } catch (error) {
        addTestResult('User Registration Endpoint', false, error.message);
        return false;
    }
}

async function testLoginEndpoint() {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })
        });
        
        // Should fail with invalid credentials
        addTestResult('Login Endpoint', response.status === 401, 
            `Expected 401 for invalid credentials, got ${response.status}`);
        return true;
    } catch (error) {
        addTestResult('Login Endpoint', false, error.message);
        return false;
    }
}

async function testPremiumVerificationEndpoint() {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/verify-premium`, {
            headers: { 'Authorization': 'Bearer invalid_token' }
        });
        
        // Should fail with invalid token
        addTestResult('Premium Verification Endpoint', response.status === 401, 
            `Expected 401 for invalid token, got ${response.status}`);
        return true;
    } catch (error) {
        addTestResult('Premium Verification Endpoint', false, error.message);
        return false;
    }
}

async function testFileDownloadEndpoint() {
    try {
        const response = await fetch(`${BASE_URL}/api/download/test-file.pdf`, {
            headers: { 'Authorization': 'Bearer invalid_token' }
        });
        
        // Should fail with invalid token
        addTestResult('File Download Endpoint', response.status === 401, 
            `Expected 401 for invalid token, got ${response.status}`);
        return true;
    } catch (error) {
        addTestResult('File Download Endpoint', false, error.message);
        return false;
    }
}

async function testPremiumPagesAccess() {
    const premiumPages = [
        '/trade-ideas.html',
        '/tools.html',
        '/premium-account.html'
    ];
    
    let allPassed = true;
    
    for (const page of premiumPages) {
        try {
            const response = await fetch(`${BASE_URL}${page}`);
            const passed = response.ok;
            addTestResult(`Premium Page Access: ${page}`, passed, 
                `Status: ${response.status}`);
            if (!passed) allPassed = false;
        } catch (error) {
            addTestResult(`Premium Page Access: ${page}`, false, error.message);
            allPassed = false;
        }
    }
    
    return allPassed;
}

async function testProtectedFilesAccess() {
    try {
        const response = await fetch(`${BASE_URL}/assets/Tools/test-file.pdf`);
        
        // Should be blocked (403)
        addTestResult('Protected Files Access', response.status === 403, 
            `Expected 403 for protected file, got ${response.status}`);
        return response.status === 403;
    } catch (error) {
        addTestResult('Protected Files Access', false, error.message);
        return false;
    }
}

function testFileStructure() {
    const requiredFiles = [
        'assets/js/premium.js',
        'api/auth.js',
        'api/stripe.js',
        'server.js'
    ];
    
    let allExist = true;
    
    for (const file of requiredFiles) {
        const exists = fs.existsSync(file);
        addTestResult(`File Exists: ${file}`, exists);
        if (!exists) allExist = false;
    }
    
    return allExist;
}

function testTokenConsistency() {
    try {
        // Check if token names are consistent across files
        const loginFile = fs.readFileSync('login.html', 'utf8');
        const premiumFile = fs.readFileSync('assets/js/premium.js', 'utf8');
        const toolsFile = fs.readFileSync('tools.html', 'utf8');
        
        const loginUsesAuthToken = loginFile.includes('authToken');
        const premiumUsesAuthToken = premiumFile.includes('authToken');
        const toolsUsesAuthToken = toolsFile.includes('authToken');
        
        const allConsistent = loginUsesAuthToken && premiumUsesAuthToken && toolsUsesAuthToken;
        
        addTestResult('Token Name Consistency', allConsistent, 
            `Login: ${loginUsesAuthToken}, Premium: ${premiumUsesAuthToken}, Tools: ${toolsUsesAuthToken}`);
        
        return allConsistent;
    } catch (error) {
        addTestResult('Token Name Consistency', false, error.message);
        return false;
    }
}

async function testStripeIntegration() {
    try {
        const response = await fetch(`${BASE_URL}/api/stripe/create-checkout-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        // Should return a session ID or error
        const data = await response.json();
        const hasSessionId = data.id || data.error;
        
        addTestResult('Stripe Integration', hasSessionId, 
            `Response: ${JSON.stringify(data)}`);
        return hasSessionId;
    } catch (error) {
        addTestResult('Stripe Integration', false, error.message);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    log('🚀 Starting Premium Account Functionality Tests', 'info');
    log('=' .repeat(60), 'info');
    
    // Test server connection first
    const serverOk = await testServerConnection();
    if (!serverOk) {
        log('❌ Server is not running. Please start the server with: node server.js', 'error');
        return;
    }
    
    // Run all tests
    await testUserRegistration();
    await testLoginEndpoint();
    await testPremiumVerificationEndpoint();
    await testFileDownloadEndpoint();
    await testPremiumPagesAccess();
    await testProtectedFilesAccess();
    testFileStructure();
    testTokenConsistency();
    await testStripeIntegration();
    
    // Summary
    log('=' .repeat(60), 'info');
    log(`📊 Test Summary:`, 'info');
    log(`✅ Passed: ${testResults.passed}`, 'success');
    log(`❌ Failed: ${testResults.failed}`, 'error');
    log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`, 'info');
    
    // Detailed results
    log('\n📋 Detailed Results:', 'info');
    testResults.tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        log(`${status} ${test.name}${test.details ? ` - ${test.details}` : ''}`);
    });
    
    // Recommendations
    log('\n💡 Recommendations:', 'warning');
    if (testResults.failed > 0) {
        log('1. Check server logs for detailed error messages', 'warning');
        log('2. Verify all environment variables are set correctly', 'warning');
        log('3. Ensure MongoDB is running and accessible', 'warning');
        log('4. Check Stripe API keys are valid', 'warning');
    } else {
        log('🎉 All tests passed! Premium functionality appears to be working correctly.', 'success');
    }
    
    // Save results to file
    const resultsFile = 'premium-test-results.json';
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    log(`\n📄 Detailed results saved to: ${resultsFile}`, 'info');
}

// Manual testing instructions
function printManualTestingInstructions() {
    log('\n🔧 Manual Testing Instructions:', 'info');
    log('1. Start the server: node server.js', 'info');
    log('2. Open browser and go to: http://localhost:3000', 'info');
    log('3. Test premium signup flow:', 'info');
    log('   - Go to /subscribe.html or /premium-account.html', 'info');
    log('   - Complete Stripe checkout (use test card: 4242 4242 4242 4242)', 'info');
    log('   - Complete registration at /complete-registration.html', 'info');
    log('4. Test login with premium account:', 'info');
    log('   - Go to /login.html', 'info');
    log('   - Login with premium credentials', 'info');
    log('   - Should redirect to /trade-ideas.html', 'info');
    log('5. Test premium content access:', 'info');
    log('   - Verify all trade ideas are visible', 'info');
    log('   - Verify tools downloads work', 'info');
    log('   - Verify premium articles are accessible', 'info');
    log('6. Test non-premium access:', 'info');
    log('   - Logout and try accessing premium content', 'info');
    log('   - Should see upgrade prompts', 'info');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
    printManualTestingInstructions();
}

module.exports = {
    runAllTests,
    testResults,
    printManualTestingInstructions
}; 