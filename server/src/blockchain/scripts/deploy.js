const hre = require("hardhat");

async function main() {
  console.log("Deploying ComplianceAuditLog contract...");

  // Get the contract factory
  const ComplianceAuditLog = await hre.ethers.getContractFactory("ComplianceAuditLog");

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
  console.log("To verify on Etherscan/Polygonscan:");
  console.log(`npx hardhat verify --network <network> ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
