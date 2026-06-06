/**
 * ComplianceRegistry Deployment Script
 *
 * Production-grade deployment script for the ComplianceRegistry smart contract.
 * Supports multi-network deployment (Ethereum mainnet, Goerli, Polygon, Polygon Mumbai),
 * gas estimation, contract verification preparation, post-deployment configuration,
 * and persistent deployment state tracking.
 *
 * Usage:
 *   DEPLOY_NETWORK=polygon PRIVATE_KEY=0x... npx ts-node deploy.ts
 *
 * Environment variables:
 *   DEPLOY_NETWORK          - Target network (ethereum | goerli | polygon | mumbai). Default: mumbai
 *   PRIVATE_KEY             - Deployer wallet private key (required)
 *   ETHEREUM_RPC_URL        - Ethereum mainnet RPC endpoint
 *   GOERLI_RPC_URL          - Goerli testnet RPC endpoint
 *   POLYGON_RPC_URL         - Polygon mainnet RPC endpoint
 *   MUMBAI_RPC_URL          - Polygon Mumbai testnet RPC endpoint
 *   ETHERSCAN_API_KEY       - Etherscan API key for contract verification
 *   POLYGONSCAN_API_KEY     - Polygonscan API key for contract verification
 *   GAS_PRICE_MULTIPLIER   - Multiplier for gas price (e.g. 1.2 = 20% above estimate). Default: 1.1
 *   DEPLOYMENT_STATE_PATH   - Path to the deployment state JSON file. Default: ./deployment-state.json
 *   ADMIN_ADDRESSES         - Comma-separated list of admin addresses to grant ADMIN_ROLE
 *   AUDITOR_ADDRESSES       - Comma-separated list of auditor addresses to grant AUDITOR_ROLE
 *   OPERATOR_ADDRESSES      - Comma-separated list of operator addresses to grant OPERATOR_ROLE
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported deployment network identifiers. */
type DeployNetwork = 'ethereum' | 'goerli' | 'polygon' | 'mumbai';

/** Per-network chain configuration. */
interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  name: string;
  blockExplorerUrl: string;
  verificationApiUrl: string;
  nativeCurrency: string;
  isTestnet: boolean;
}

/** Record of a single deployment persisted to the state file. */
interface DeploymentRecord {
  network: DeployNetwork;
  chainId: number;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  deployerAddress: string;
  timestamp: string;
  compilerVersion: string;
  optimizerEnabled: boolean;
  optimizerRuns: number;
  constructorArgs: string[];
  gasUsed: string;
  effectiveGasPrice: string;
  verified: boolean;
}

/** Shape of the persistent deployment state file. */
interface DeploymentState {
  lastUpdated: string;
  deployments: Record<DeployNetwork, DeploymentRecord | null>;
}

// ---------------------------------------------------------------------------
// Network Configuration
// ---------------------------------------------------------------------------

function getNetworkConfigs(): Record<DeployNetwork, NetworkConfig> {
  return {
    ethereum: {
      chainId: 1,
      // Mainnet RPC must be supplied explicitly; no shared public/demo fallback.
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      name: 'Ethereum Mainnet',
      blockExplorerUrl: 'https://etherscan.io',
      verificationApiUrl: 'https://api.etherscan.io/api',
      nativeCurrency: 'ETH',
      isTestnet: false,
    },
    goerli: {
      chainId: 5,
      rpcUrl: process.env.GOERLI_RPC_URL || 'https://eth-goerli.g.alchemy.com/v2/demo',
      name: 'Goerli Testnet',
      blockExplorerUrl: 'https://goerli.etherscan.io',
      verificationApiUrl: 'https://api-goerli.etherscan.io/api',
      nativeCurrency: 'ETH',
      isTestnet: true,
    },
    polygon: {
      chainId: 137,
      // Mainnet RPC must be supplied explicitly; no shared public/demo fallback.
      rpcUrl: process.env.POLYGON_RPC_URL || '',
      name: 'Polygon Mainnet',
      blockExplorerUrl: 'https://polygonscan.com',
      verificationApiUrl: 'https://api.polygonscan.com/api',
      nativeCurrency: 'MATIC',
      isTestnet: false,
    },
    mumbai: {
      chainId: 80001,
      rpcUrl: process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
      name: 'Polygon Mumbai Testnet',
      blockExplorerUrl: 'https://mumbai.polygonscan.com',
      verificationApiUrl: 'https://api-testnet.polygonscan.com/api',
      nativeCurrency: 'MATIC',
      isTestnet: true,
    },
  };
}

// ---------------------------------------------------------------------------
// Artifact Loading
// ---------------------------------------------------------------------------

interface ContractArtifact {
  abi: any[];
  bytecode: string;
  contractName: string;
}

function loadArtifact(): ContractArtifact {
  const artifactPath = path.resolve(__dirname, '../artifacts/ComplianceRegistry.json');
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found at ${artifactPath}. Run "npx hardhat compile" first.`);
  }
  const raw = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
  return {
    abi: raw.abi,
    bytecode: raw.bytecode,
    contractName: raw.contractName || 'ComplianceRegistry',
  };
}

// ---------------------------------------------------------------------------
// Deployment State File
// ---------------------------------------------------------------------------

function getStatePath(): string {
  return process.env.DEPLOYMENT_STATE_PATH || path.resolve(__dirname, '../deployment-state.json');
}

function loadDeploymentState(): DeploymentState {
  const statePath = getStatePath();
  if (fs.existsSync(statePath)) {
    return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  }
  return {
    lastUpdated: new Date().toISOString(),
    deployments: {
      ethereum: null,
      goerli: null,
      polygon: null,
      mumbai: null,
    },
  };
}

function saveDeploymentState(state: DeploymentState): void {
  state.lastUpdated = new Date().toISOString();
  const statePath = getStatePath();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
  console.log(`[deploy] Deployment state saved to ${statePath}`);
}

// ---------------------------------------------------------------------------
// Logging Helpers
// ---------------------------------------------------------------------------

function log(msg: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function logSection(title: string): void {
  console.log('');
  console.log('='.repeat(72));
  console.log(`  ${title}`);
  console.log('='.repeat(72));
}

// ---------------------------------------------------------------------------
// Gas Estimation
// ---------------------------------------------------------------------------

async function estimateDeploymentGas(
  provider: ethers.JsonRpcProvider,
  artifact: ContractArtifact,
  gasPriceMultiplier: number,
): Promise<{
  estimatedGas: bigint;
  gasPrice: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedCostWei: bigint;
  estimatedCostEth: string;
}> {
  log('Estimating deployment gas...');

  // Estimate gas for contract creation
  const estimatedGas = await provider.estimateGas({
    data: artifact.bytecode,
  });

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? 0n;
  const maxFeePerGas = feeData.maxFeePerGas ?? gasPrice;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? 0n;

  // Apply multiplier for safety margin
  const multipliedGasPrice = (gasPrice * BigInt(Math.round(gasPriceMultiplier * 100))) / 100n;
  const estimatedCostWei = estimatedGas * multipliedGasPrice;
  const estimatedCostEth = ethers.formatEther(estimatedCostWei);

  log(`  Estimated gas:           ${estimatedGas.toString()}`);
  log(`  Gas price:               ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
  log(`  Max fee per gas:         ${ethers.formatUnits(maxFeePerGas, 'gwei')} gwei`);
  log(`  Max priority fee:        ${ethers.formatUnits(maxPriorityFeePerGas, 'gwei')} gwei`);
  log(`  Estimated cost (${gasPriceMultiplier}x):  ${estimatedCostEth} ETH/MATIC`);

  return {
    estimatedGas,
    gasPrice: multipliedGasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    estimatedCostWei,
    estimatedCostEth,
  };
}

// ---------------------------------------------------------------------------
// Contract Verification Preparation
// ---------------------------------------------------------------------------

interface VerificationPayload {
  apiUrl: string;
  params: Record<string, string>;
  curlCommand: string;
}

function prepareVerification(
  networkConfig: NetworkConfig,
  contractAddress: string,
  artifact: ContractArtifact,
  network: DeployNetwork,
): VerificationPayload {
  const apiKey =
    network === 'ethereum' || network === 'goerli'
      ? process.env.ETHERSCAN_API_KEY || ''
      : process.env.POLYGONSCAN_API_KEY || '';

  const params: Record<string, string> = {
    apikey: apiKey,
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress: contractAddress,
    sourceCode: (() => { try { return fs.readFileSync(path.resolve(__dirname, '../contracts/ComplianceRegistry.sol'), 'utf8'); } catch { return ''; } })(),
    codeformat: 'solidity-single-file',
    contractname: 'ComplianceRegistry',
    compilerversion: 'v0.8.20+commit.a1b79de6',
    optimizationUsed: '1',
    runs: '200',
    evmversion: 'shanghai',
    licenseType: '3', // MIT
  };

  // The printed curl command must not embed the secret API key; reference the
  // env var name instead so deploy/CI logs never leak it. The operator exports
  // the matching variable before running the command.
  const apiKeyEnvVar =
    network === 'ethereum' || network === 'goerli'
      ? 'ETHERSCAN_API_KEY'
      : 'POLYGONSCAN_API_KEY';

  const curlCommand = [
    `curl -X POST "${networkConfig.verificationApiUrl}"`,
    `  -d "apikey=$${apiKeyEnvVar}"`,
    `  -d "module=contract"`,
    `  -d "action=verifysourcecode"`,
    `  -d "contractaddress=${contractAddress}"`,
    `  -d "codeformat=solidity-single-file"`,
    `  -d "contractname=ComplianceRegistry"`,
    `  -d "compilerversion=v0.8.20+commit.a1b79de6"`,
    `  -d "optimizationUsed=1"`,
    `  -d "runs=200"`,
    `  -d "evmversion=shanghai"`,
    `  -d "licenseType=3"`,
    `  --data-urlencode "sourceCode@contracts/ComplianceRegistry.sol"`,
  ].join(' \\\n');

  return { apiUrl: networkConfig.verificationApiUrl, params, curlCommand };
}

// ---------------------------------------------------------------------------
// Post-Deployment Configuration
// ---------------------------------------------------------------------------

async function configureRoles(
  contract: ethers.Contract,
  signer: ethers.Wallet,
): Promise<void> {
  logSection('Post-Deployment Configuration');

  // Parse role addresses from environment
  const adminAddrs = (process.env.ADMIN_ADDRESSES || '').split(',').filter(Boolean);
  const auditorAddrs = (process.env.AUDITOR_ADDRESSES || '').split(',').filter(Boolean);
  const operatorAddrs = (process.env.OPERATOR_ADDRESSES || '').split(',').filter(Boolean);

  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'));
  const AUDITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes('AUDITOR_ROLE'));
  const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes('OPERATOR_ROLE'));

  const roleGrants: Array<{ role: string; roleName: string; address: string }> = [];

  for (const addr of adminAddrs) {
    if (ethers.isAddress(addr.trim()) && addr.trim().toLowerCase() !== signer.address.toLowerCase()) {
      roleGrants.push({ role: ADMIN_ROLE, roleName: 'ADMIN_ROLE', address: addr.trim() });
    }
  }
  for (const addr of auditorAddrs) {
    if (ethers.isAddress(addr.trim())) {
      roleGrants.push({ role: AUDITOR_ROLE, roleName: 'AUDITOR_ROLE', address: addr.trim() });
    }
  }
  for (const addr of operatorAddrs) {
    if (ethers.isAddress(addr.trim())) {
      roleGrants.push({ role: OPERATOR_ROLE, roleName: 'OPERATOR_ROLE', address: addr.trim() });
    }
  }

  if (roleGrants.length === 0) {
    log('No additional role grants configured. Deployer holds all roles by default.');
    return;
  }

  log(`Granting ${roleGrants.length} role(s)...`);

  for (const grant of roleGrants) {
    try {
      log(`  Granting ${grant.roleName} to ${grant.address}...`);
      const tx = await contract.grantRole(grant.role, grant.address);
      const receipt = await tx.wait();
      log(`    Confirmed in block ${receipt.blockNumber} (tx: ${receipt.hash})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`    WARNING: Failed to grant ${grant.roleName} to ${grant.address}: ${msg}`);
    }
  }

  log('Role configuration complete.');
}

// ---------------------------------------------------------------------------
// Main Deployment
// ---------------------------------------------------------------------------

async function deploy(): Promise<void> {
  logSection('ComplianceRegistry Deployment');

  // ---- Resolve target network ----
  const targetNetwork = (process.env.DEPLOY_NETWORK || 'mumbai') as DeployNetwork;
  const configs = getNetworkConfigs();
  const networkConfig = configs[targetNetwork];
  if (!networkConfig) {
    throw new Error(`Unknown network: ${targetNetwork}. Supported: ${Object.keys(configs).join(', ')}`);
  }

  // Mainnet networks must use a dedicated RPC endpoint. Fail closed if the
  // operator did not supply one rather than silently using a public/demo URL.
  if (!networkConfig.isTestnet && !networkConfig.rpcUrl) {
    const envVar = targetNetwork === 'ethereum' ? 'ETHEREUM_RPC_URL' : 'POLYGON_RPC_URL';
    throw new Error(
      `${envVar} is required to deploy to ${networkConfig.name} (mainnet). ` +
        'Set it to a dedicated RPC endpoint; public/demo endpoints are not permitted for mainnet.',
    );
  }

  log(`Target network: ${networkConfig.name} (chainId ${networkConfig.chainId})`);

  // ---- Pre-flight checks ----
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required.');
  }

  // ---- Load artifact ----
  const artifact = loadArtifact();
  log(`Artifact loaded: ${artifact.contractName} (${artifact.abi.length} ABI entries)`);

  // ---- Create provider & wallet ----
  const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl, {
    chainId: networkConfig.chainId,
    name: targetNetwork,
  });

  // Verify connectivity
  const network = await provider.getNetwork();
  log(`Connected to chain ID: ${network.chainId}`);
  if (Number(network.chainId) !== networkConfig.chainId) {
    throw new Error(
      `Chain ID mismatch: expected ${networkConfig.chainId}, got ${network.chainId}`,
    );
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  const deployerAddr = wallet.address;

  // Check deployer balance
  const balance = await provider.getBalance(deployerAddr);
  log(`Deployer: ${deployerAddr}`);
  log(`Balance:  ${ethers.formatEther(balance)} ${networkConfig.nativeCurrency}`);

  if (balance === 0n) {
    throw new Error('Deployer wallet has zero balance. Fund it before deploying.');
  }

  // ---- Gas estimation ----
  logSection('Gas Estimation');
  const gasPriceMultiplier = parseFloat(process.env.GAS_PRICE_MULTIPLIER || '1.1');
  const gasEstimate = await estimateDeploymentGas(provider, artifact, gasPriceMultiplier);

  if (balance < gasEstimate.estimatedCostWei) {
    throw new Error(
      `Insufficient balance. Need ~${gasEstimate.estimatedCostEth} ${networkConfig.nativeCurrency} ` +
        `but only have ${ethers.formatEther(balance)} ${networkConfig.nativeCurrency}.`,
    );
  }

  // ---- Safety gate for mainnets ----
  if (!networkConfig.isTestnet) {
    log('');
    log('*** MAINNET DEPLOYMENT ***');
    log(`Network:  ${networkConfig.name}`);
    log(`Deployer: ${deployerAddr}`);
    log(`Cost:     ~${gasEstimate.estimatedCostEth} ${networkConfig.nativeCurrency}`);
    log('');
    log('Proceeding with deployment in 5 seconds...');
    await new Promise((r) => setTimeout(r, 5000));
  }

  // ---- Deploy ----
  logSection('Contract Deployment');
  log('Deploying ComplianceRegistry...');

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  const deployTx = await factory.deploy({
    gasLimit: (gasEstimate.estimatedGas * 120n) / 100n, // 20% buffer
  });

  log(`Transaction sent: ${deployTx.deploymentTransaction()?.hash}`);
  log('Waiting for confirmation...');

  await deployTx.waitForDeployment();
  const contractAddress = await deployTx.getAddress();

  // Retrieve the deployment receipt
  const txHash = deployTx.deploymentTransaction()?.hash || '';
  const receipt = txHash ? await provider.getTransactionReceipt(txHash) : null;
  const blockNumber = receipt?.blockNumber ?? 0;
  const gasUsed = receipt?.gasUsed?.toString() ?? '0';
  const effectiveGasPrice = receipt?.gasPrice?.toString() ?? '0';

  log('');
  log(`Contract deployed successfully!`);
  log(`  Address:      ${contractAddress}`);
  log(`  Tx hash:      ${txHash}`);
  log(`  Block number: ${blockNumber}`);
  log(`  Gas used:     ${gasUsed}`);
  log(`  Explorer:     ${networkConfig.blockExplorerUrl}/address/${contractAddress}`);

  // ---- Verify on-chain code exists ----
  const code = await provider.getCode(contractAddress);
  if (code === '0x' || code === '0x0') {
    throw new Error('Contract deployment verification failed: no bytecode at deployed address.');
  }
  log('  On-chain code verified.');

  // ---- Persist deployment state ----
  logSection('Deployment State');
  const state = loadDeploymentState();
  const deploymentRecord: DeploymentRecord = {
    network: targetNetwork,
    chainId: networkConfig.chainId,
    contractAddress,
    transactionHash: txHash,
    blockNumber,
    deployerAddress: deployerAddr,
    timestamp: new Date().toISOString(),
    compilerVersion: '0.8.20+commit.a1b79de6',
    optimizerEnabled: true,
    optimizerRuns: 200,
    constructorArgs: [],
    gasUsed,
    effectiveGasPrice,
    verified: false,
  };
  state.deployments[targetNetwork] = deploymentRecord;
  saveDeploymentState(state);

  // ---- Save deployment receipt log ----
  const receiptLogPath = path.resolve(
    __dirname,
    `../deployment-receipt-${targetNetwork}-${Date.now()}.json`,
  );
  fs.writeFileSync(receiptLogPath, JSON.stringify(deploymentRecord, null, 2), 'utf-8');
  log(`Deployment receipt saved to ${receiptLogPath}`);

  // ---- Post-deployment role configuration ----
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  await configureRoles(contract, wallet);

  // ---- Verification preparation ----
  logSection('Contract Verification');
  const verification = prepareVerification(networkConfig, contractAddress, artifact, targetNetwork);
  log('To verify on block explorer, run:');
  log('');
  log(verification.curlCommand);
  log('');
  log('Or use Hardhat:');
  log(`  npx hardhat verify --network ${targetNetwork} ${contractAddress}`);

  // ---- Summary ----
  logSection('Deployment Summary');
  log(`  Network:          ${networkConfig.name}`);
  log(`  Contract address: ${contractAddress}`);
  log(`  Transaction:      ${txHash}`);
  log(`  Block:            ${blockNumber}`);
  log(`  Gas used:         ${gasUsed}`);
  log(`  Deployer:         ${deployerAddr}`);
  log('');
  log('Add the following to your .env file:');
  log(`  COMPLIANCE_REGISTRY_ADDRESS=${contractAddress}`);
  log(`  COMPLIANCE_REGISTRY_NETWORK=${targetNetwork}`);
  log(`  COMPLIANCE_REGISTRY_CHAIN_ID=${networkConfig.chainId}`);
  log('');
  log('Deployment complete.');
}

// ---------------------------------------------------------------------------
// Multi-Network Deployment Helper
// ---------------------------------------------------------------------------

/**
 * Deploy to multiple networks sequentially.
 * Usage: DEPLOY_NETWORKS=goerli,mumbai PRIVATE_KEY=0x... npx ts-node deploy.ts --multi
 */
async function deployMultiNetwork(): Promise<void> {
  const networks = (process.env.DEPLOY_NETWORKS || '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean) as DeployNetwork[];

  if (networks.length === 0) {
    throw new Error(
      'DEPLOY_NETWORKS must be a comma-separated list of networks (e.g. "goerli,mumbai").',
    );
  }

  logSection('Multi-Network Deployment');
  log(`Target networks: ${networks.join(', ')}`);

  for (const network of networks) {
    log('');
    log(`--- Deploying to ${network} ---`);
    process.env.DEPLOY_NETWORK = network;
    try {
      await deploy();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`FAILED on ${network}: ${msg}`);
      log('Continuing to next network...');
    }
  }

  log('');
  log('Multi-network deployment complete.');
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const isMulti = args.includes('--multi');

(isMulti ? deployMultiNetwork() : deploy())
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('[deploy] Fatal error:', error);
    process.exit(1);
  });

export {
  deploy,
  deployMultiNetwork,
  loadArtifact,
  loadDeploymentState,
  saveDeploymentState,
  estimateDeploymentGas,
  prepareVerification,
  configureRoles,
  DeployNetwork,
  NetworkConfig,
  DeploymentRecord,
  DeploymentState,
  ContractArtifact,
};
