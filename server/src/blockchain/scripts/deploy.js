// Run with: npx hardhat run scripts/deploy.js --network <network>
// Hardhat 3 API: the ethers object comes from a network connection created by
// the hardhat-ethers plugin registered in hardhat.config.js.
import { network } from "hardhat";

async function main() {
  console.log("Deploying ComplianceAuditLog contract...");

  const { ethers } = await network.create();

  // Get the contract factory
  const ComplianceAuditLog = await ethers.getContractFactory("ComplianceAuditLog");

  // Deploy the contract
  const contract = await ComplianceAuditLog.deploy();

  // Wait for deployment
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("✓ ComplianceAuditLog deployed to:", address);
  console.log("");
  console.log("Add this to your .env file:");
  console.log(`BLOCKCHAIN_CONTRACT_ADDRESS=${address}`);
  console.log("");
  console.log("To verify the source on Etherscan/Polygonscan, add the");
  console.log("@nomicfoundation/hardhat-verify plugin and run:");
  console.log(`npx hardhat verify --network <network> ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
