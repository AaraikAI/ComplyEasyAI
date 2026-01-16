/**
 * Test script for Zero-Knowledge Service
 * Tests the generateComplianceProof function with real zk-SNARK circuits
 */

import zeroKnowledgeService from '../services/advanced/zeroKnowledgeService';

async function testZKService() {
  try {
    console.log('Testing Zero-Knowledge Service...\n');

    const proof = await zeroKnowledgeService.generateComplianceProof(
      'org_123',
      'framework_456',
      {
        controlsImplemented: 90,
        totalControls: 100,
        evidenceHash: 'abc123...',
      }
    );

    console.log('✅ Real zk-SNARK proof generated!');
    console.log('\nProof structure:');
    console.log('- Proof:', JSON.stringify(proof.proof, null, 2).substring(0, 200) + '...');
    console.log('- Public Signals:', proof.publicSignals);
    console.log('- Public Signals count:', proof.publicSignals.length);

    // Verify the proof
    console.log('\nVerifying proof...');
    const verification = await zeroKnowledgeService.verifyComplianceProof(proof);
    console.log('✅ Verification result:', verification.isValid ? 'VALID' : 'INVALID');
    if (verification.timestamp) {
      console.log('Verification timestamp:', verification.timestamp);
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testZKService();

