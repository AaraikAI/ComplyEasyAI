/**
 * Test script for POST /api/ai-rmf/systems
 * 
 * Usage:
 *   node test_ai_rmf_create.js [your-jwt-token]
 * 
 * Or set TOKEN environment variable:
 *   export TOKEN=your-jwt-token
 *   node test_ai_rmf_create.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const TOKEN = process.argv[2] || process.env.TOKEN;

if (!TOKEN) {
  console.error('❌ Error: No authentication token provided');
  console.log('\nUsage:');
  console.log('  node test_ai_rmf_create.js <your-jwt-token>');
  console.log('\nOr set TOKEN environment variable:');
  console.log('  export TOKEN=your-jwt-token');
  console.log('  node test_ai_rmf_create.js');
  console.log('\nTo get a token:');
  console.log('  1. POST /api/auth/magic-link with your email');
  console.log('  2. Check email for magic link or use devToken from response');
  console.log('  3. POST /api/auth/verify with the token');
  process.exit(1);
}

const testData = {
  name: "Medical Diagnosis AI System",
  description: "AI system for medical image diagnosis and analysis using deep learning",
  systemType: "Machine Learning",
  useCase: "Radiology image analysis for early disease detection",
  deploymentContext: "Healthcare",
  lifecycleStage: "Deploy_and_Operate",
  autonomyLevel: "Human_in_Loop",
  metadata: {
    modelType: "Deep Learning",
    trainingData: "Medical imaging datasets",
    compliance: ["HIPAA", "FDA"],
    version: "1.0.0"
  }
};

async function testCreateAISystem() {
  try {
    console.log('🚀 Testing POST /api/ai-rmf/systems');
    console.log('📋 Request Data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n⏳ Sending request...\n');

    const response = await fetch(`${API_URL}/ai-rmf/systems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(testData)
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('✅ Success! AI System created:');
      console.log(JSON.stringify(responseData, null, 2));
      console.log(`\n📊 System ID: ${responseData.id}`);
      console.log(`\n🔗 Next steps:`);
      console.log(`   GET ${API_URL}/ai-rmf/systems/${responseData.id}`);
      console.log(`   GET ${API_URL}/ai-rmf/dashboard`);
    } else {
      console.error('❌ Error:', response.status, response.statusText);
      console.error('Response:', JSON.stringify(responseData, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    process.exit(1);
  }
}

testCreateAISystem();

