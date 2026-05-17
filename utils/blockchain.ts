/**
 * Build a public blockchain explorer URL for a transaction hash.
 * Returns null for networks without a public explorer (e.g. private Hyperledger).
 */
export function getBlockchainExplorerUrl(transactionHash: string, network: string): string | null {
  if (!transactionHash) return null;

  switch (network?.toLowerCase()) {
    case 'ethereum':
      return `https://etherscan.io/tx/${transactionHash}`;
    case 'polygon':
      return `https://polygonscan.com/tx/${transactionHash}`;
    case 'hyperledger':
      return null;
    default:
      return `https://polygonscan.com/tx/${transactionHash}`;
  }
}
