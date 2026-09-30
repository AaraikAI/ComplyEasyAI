import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";

// Hardhat 3 registers plugins explicitly. The only plugin this package uses is
// hardhat-ethers (scripts/deploy.js). @nomicfoundation/hardhat-toolbox is not
// used: 6.x targets Hardhat 2 and 7.0.0 exits the process when imported.
const solc = {
  version: "0.8.20",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};

export default defineConfig({
  plugins: [hardhatEthers],
  solidity: {
    compilers: [solc],
    overrides: {
      // ComplianceRegistry.sol fails with "Stack too deep" on the legacy
      // codegen pipeline; the IR pipeline compiles it. The ABI is unchanged.
      "contracts/ComplianceRegistry.sol": {
        ...solc,
        settings: { ...solc.settings, viaIR: true }
      }
    }
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts"
  }
});
