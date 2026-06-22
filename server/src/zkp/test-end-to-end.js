#!/usr/bin/env node
/**
 * End-to-end ZK proof + verification smoke test.
 * Generates a proof for each of the three production-grade circuits,
 * verifies it locally with snarkjs, and reports timings.
 */
const snarkjs = require('snarkjs');
const { buildPoseidon } = require('circomlibjs');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;

async function poseidon(inputs) {
  const p = await buildPoseidon();
  const out = p(inputs);
  return p.F.toObject(out);
}

async function runTest(name, witnessInput, expectedOutput) {
  // setup-circuits.sh relocates the circom-default compiled/<name>_js/<name>.wasm
  // to compiled/wasm/<name>.wasm — the same path the runtime service loads.
  const wasmPath = path.join(ROOT, 'compiled', 'wasm', `${name}.wasm`);
  const zkeyPath = path.join(ROOT, 'keys', 'proving', `${name}.zkey`);
  const vkeyPath = path.join(ROOT, 'keys', 'verification', `${name}.vkey`);
  const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));

  console.log(`\n=== ${name} ===`);
  const t0 = Date.now();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    witnessInput,
    wasmPath,
    zkeyPath
  );
  const tProve = Date.now() - t0;

  const t1 = Date.now();
  const ok = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  const tVerify = Date.now() - t1;

  console.log(`  proof: ${tProve} ms | verify: ${tVerify} ms | result=${ok}`);
  console.log(`  publicSignals = ${JSON.stringify(publicSignals)}`);
  if (!ok) throw new Error(`Verification failed for ${name}`);
  if (expectedOutput != null && publicSignals[0] !== String(expectedOutput)) {
    throw new Error(
      `Expected output ${expectedOutput} but got ${publicSignals[0]} for ${name}`
    );
  }
  console.log(`  OK`);
}

(async () => {
  try {
    // ---- compliance_check ----
    const controlsImplemented = 85n;
    const totalControls = 100n;
    const evidenceSalt = 12345n;
    const threshold = 80n;
    const organizationCommit = 0xfeed1234n;
    const evidenceCommitment = await poseidon([
      controlsImplemented, totalControls, evidenceSalt, organizationCommit,
    ]);
    await runTest('compliance_check',
      {
        controlsImplemented: controlsImplemented.toString(),
        totalControls: totalControls.toString(),
        evidenceSalt: evidenceSalt.toString(),
        threshold: threshold.toString(),
        organizationCommit: organizationCommit.toString(),
        evidenceCommitment: evidenceCommitment.toString(),
      },
      1, // meetsThreshold = 1 (85*100 >= 80*100)
    );

    // ---- credential_verification ----
    const roleLevel = 5n;
    const permissionsHash = 0xabcdef1234567890n;
    const issuedTimestamp = 1700000000n;
    const expiryTimestamp = 1900000000n;
    const subjectSecret = 0xdeadbeefcafeb0bafacefeed1234abcdn;
    const currentTimestamp = 1800000000n;
    const requiredRoleLevel = 3n;
    const credentialCommitment = await poseidon([
      roleLevel, permissionsHash, issuedTimestamp, expiryTimestamp, subjectSecret,
    ]);
    const nullifier = await poseidon([subjectSecret, currentTimestamp]);
    await runTest('credential_verification',
      {
        roleLevel: roleLevel.toString(),
        permissionsHash: permissionsHash.toString(),
        issuedTimestamp: issuedTimestamp.toString(),
        expiryTimestamp: expiryTimestamp.toString(),
        subjectSecret: subjectSecret.toString(),
        currentTimestamp: currentTimestamp.toString(),
        requiredRoleLevel: requiredRoleLevel.toString(),
        credentialCommitment: credentialCommitment.toString(),
        nullifier: nullifier.toString(),
      },
      1, // isValid = 1
    );

    // ---- data_ownership ----
    const sk = 0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcden;
    const userIdSalt = 0x1111n;
    const dataHash = 0x2222n;
    const dataSalt = 0x3333n;
    const claimContext = 0x4444n;
    const ownerCommitment = await poseidon([sk, userIdSalt]);
    const dataCommitment = await poseidon([sk, dataHash, dataSalt]);
    const dataNullifier = await poseidon([sk, claimContext]);
    await runTest('data_ownership',
      {
        sk: sk.toString(),
        userIdSalt: userIdSalt.toString(),
        dataHash: dataHash.toString(),
        dataSalt: dataSalt.toString(),
        ownerCommitment: ownerCommitment.toString(),
        dataCommitment: dataCommitment.toString(),
        claimContext: claimContext.toString(),
        nullifier: dataNullifier.toString(),
      },
      1, // ownershipVerified = 1
    );

    console.log('\nAll 3 circuits prove + verify successfully.');
    process.exit(0);
  } catch (e) {
    console.error('\nFAILED:', e.message);
    console.error(e);
    process.exit(1);
  }
})();
