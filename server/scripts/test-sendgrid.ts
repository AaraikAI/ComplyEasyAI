#!/usr/bin/env ts-node
/**
 * SendGrid Connection Test Script
 * Tests the SendGrid API key and email sending functionality
 */

import dotenv from 'dotenv';
import path from 'path';
import sgMail from '@sendgrid/mail';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'ComplyEasy AI';
const TEST_EMAIL = process.env.TEST_EMAIL || process.env.SENDGRID_FROM_EMAIL;

async function testSendGridConnection() {
  console.log('\n🔍 Testing SendGrid Connection...\n');
  console.log('=' .repeat(60));

  // Check if API key is set
  if (!SENDGRID_API_KEY) {
    console.error('❌ ERROR: SENDGRID_API_KEY is not set in environment variables');
    console.error('   Please set SENDGRID_API_KEY in server/.env file');
    process.exit(1);
  }

  // Check API key format
  if (!SENDGRID_API_KEY.startsWith('SG.')) {
    console.error('❌ ERROR: Invalid SendGrid API key format');
    console.error(`   API key should start with "SG." but got: ${SENDGRID_API_KEY.substring(0, 10)}...`);
    console.error('   Please check your SENDGRID_API_KEY in server/.env file');
    process.exit(1);
  }

  console.log('✅ SENDGRID_API_KEY is set and format is valid');
  console.log(`   Key preview: ${SENDGRID_API_KEY.substring(0, 10)}...`);

  // Check if FROM_EMAIL is set
  if (!SENDGRID_FROM_EMAIL) {
    console.error('❌ ERROR: SENDGRID_FROM_EMAIL is not set');
    console.error('   Please set SENDGRID_FROM_EMAIL in server/.env file');
    process.exit(1);
  }

  console.log(`✅ SENDGRID_FROM_EMAIL is set: ${SENDGRID_FROM_EMAIL}`);
  console.log(`✅ SENDGRID_FROM_NAME is set: ${SENDGRID_FROM_NAME}`);

  // Set API key
  try {
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('✅ SendGrid API key initialized');
  } catch (error: any) {
    console.error('❌ ERROR: Failed to initialize SendGrid API key');
    console.error(`   ${error.message}`);
    process.exit(1);
  }

  // Test API key by making a simple API call
  console.log('\n📡 Testing API key validity...');
  
  // Determine recipient email
  const recipientEmail = TEST_EMAIL || SENDGRID_FROM_EMAIL;
  console.log(`   Sending test email to: ${recipientEmail}`);
  console.log(`   From: ${SENDGRID_FROM_EMAIL}`);
  
  if (recipientEmail === SENDGRID_FROM_EMAIL) {
    console.log(`   ⚠️  NOTE: Sending to the same address as sender (${SENDGRID_FROM_EMAIL})`);
    console.log(`   💡 TIP: Set TEST_EMAIL environment variable to send to a different address`);
    console.log(`   Example: TEST_EMAIL=your-email@gmail.com npm run test:sendgrid`);
  }
  
  try {
    // Send a test email
    const testMessage = {
      to: recipientEmail,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      subject: 'ComplyEasy AI - SendGrid Connection Test',
      text: 'This is a test email to verify SendGrid connection. If you receive this, your SendGrid configuration is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0284c7;">✅ SendGrid Connection Test</h2>
          <p>This is a test email to verify your SendGrid configuration.</p>
          <p>If you receive this email, your SendGrid API key and sender email are configured correctly!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Sent from ComplyEasy AI Production Setup<br>
            Timestamp: ${new Date().toISOString()}
          </p>
        </div>
      `,
    };

    const result = await sgMail.send(testMessage);
    
    console.log('\n✅ SUCCESS: Test email sent successfully!');
    console.log(`   Status Code: ${result[0].statusCode}`);
    console.log(`   Message ID: ${result[0].headers['x-message-id'] || 'N/A'}`);
    
    if (result[0].headers['x-message-id']) {
      console.log(`\n📊 Check SendGrid Activity Logs:`);
      console.log(`   https://app.sendgrid.com/activity`);
      console.log(`   Look for message ID: ${result[0].headers['x-message-id']}`);
      console.log(`   This will show delivery status, bounces, spam reports, etc.`);
    }
    
    console.log(`\n📧 Email Details:`);
    console.log(`   To: ${recipientEmail}`);
    console.log(`   From: ${SENDGRID_FROM_EMAIL}`);
    console.log(`   Subject: ComplyEasy AI - SendGrid Connection Test`);
    console.log(`\n💡 Troubleshooting if email not received:`);
    console.log(`   1. Check spam/junk folder`);
    console.log(`   2. Check SendGrid Activity Logs: https://app.sendgrid.com/activity`);
    console.log(`   3. Verify recipient email address is correct`);
    console.log(`   4. Try sending to a different email address:`);
    console.log(`      TEST_EMAIL=your-email@gmail.com npm run test:sendgrid`);
    console.log(`   5. Check if your email provider is blocking SendGrid`);
    console.log(`   6. Wait a few minutes - delivery can take 1-5 minutes`);
    
    return true;
  } catch (error: any) {
    console.error('\n❌ ERROR: Failed to send test email');
    console.error(`   Status Code: ${error.code || 'N/A'}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.response) {
      console.error(`   Response Body: ${JSON.stringify(error.response.body, null, 2)}`);
    }

    // Provide specific error guidance
    if (error.code === 401 || error.message?.includes('Unauthorized')) {
      console.error('\n💡 TROUBLESHOOTING:');
      console.error('   - Your SendGrid API key is invalid or has been revoked');
      console.error('   - Go to https://app.sendgrid.com/settings/api_keys');
      console.error('   - Create a new API key with "Full Access" permissions');
      console.error('   - Update SENDGRID_API_KEY in server/.env');
    } else if (error.code === 403 || error.message?.includes('Forbidden')) {
      console.error('\n💡 TROUBLESHOOTING:');
      console.error('   - Your API key does not have permission to send emails');
      console.error('   - Go to https://app.sendgrid.com/settings/api_keys');
      console.error('   - Ensure your API key has "Mail Send" permissions');
    } else if (error.message?.includes('sender') || error.message?.includes('from')) {
      console.error('\n💡 TROUBLESHOOTING:');
      console.error(`   - The sender email "${SENDGRID_FROM_EMAIL}" is not verified`);
      console.error('   - Go to https://app.sendgrid.com/settings/sender_auth');
      console.error('   - Verify your sender email or domain');
      console.error('   - Single Sender Verification: https://app.sendgrid.com/settings/sender_auth/senders/new');
    } else {
      console.error('\n💡 TROUBLESHOOTING:');
      console.error('   - Check your SendGrid account status');
      console.error('   - Verify your account is not suspended');
      console.error('   - Check SendGrid status page: https://status.sendgrid.com/');
    }
    
    process.exit(1);
  }
}

// Run the test
testSendGridConnection()
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ SendGrid connection test completed successfully!');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });

