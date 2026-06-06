# Powers of Tau Download Sources

If the automated download fails, you can manually download the Powers of Tau file from any of these verified sources.

> **MANDATORY:** every download below MUST be followed immediately by the SHA256
> verification step. The setup MUST abort and the downloaded file MUST be deleted
> on any checksum mismatch — never proceed to circuit setup with an unverified
> `.ptau`. Run after each `curl`/`wget`:
>
> ```bash
> echo "dcf4ea473bf14b971ce5f7b7c1d6ce1c41a8ed042cdb75b65ca9178e3a3c7c17  powersOfTau28_hez_final_12.ptau" | sha256sum -c - \
>   || { echo "CHECKSUM MISMATCH — aborting"; rm -f powersOfTau28_hez_final_12.ptau; exit 1; }
> ```

## File Details
- **Filename:** `powersOfTau28_hez_final_12.ptau`
- **Size:** ~6.5 MB
- **Authoritative hash (blake2b, published by snarkjs):**
  `ded2694169b7b08e898f736d5de95af87c3f1a64594013351b1a796dbee393bd825f88f9468c84505ddd11eb0b1465ac9b43b9064aa8ec97f2b73e04758b8a4a`
  (verify with `snarkjs powersoftau verify`)
- **Pinned SHA256 (enforced by `setup-circuits.sh` via `checksums.sha256`):**
  `dcf4ea473bf14b971ce5f7b7c1d6ce1c41a8ed042cdb75b65ca9178e3a3c7c17`

## Primary Sources (Most Reliable)

### 1. Google Cloud Storage (Polygon zkEVM)
```bash
curl -L -o powersOfTau28_hez_final_12.ptau \
  "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau"
echo "dcf4ea473bf14b971ce5f7b7c1d6ce1c41a8ed042cdb75b65ca9178e3a3c7c17  powersOfTau28_hez_final_12.ptau" | sha256sum -c - \
  || { echo "CHECKSUM MISMATCH — aborting"; rm -f powersOfTau28_hez_final_12.ptau; exit 1; }
```

### 2. GitHub - SnarkJS Repository
```bash
curl -L -o powersOfTau28_hez_final_12.ptau \
  "https://github.com/iden3/snarkjs/raw/master/build/powersOfTau28_hez_final_12.ptau"
echo "dcf4ea473bf14b971ce5f7b7c1d6ce1c41a8ed042cdb75b65ca9178e3a3c7c17  powersOfTau28_hez_final_12.ptau" | sha256sum -c - \
  || { echo "CHECKSUM MISMATCH — aborting"; rm -f powersOfTau28_hez_final_12.ptau; exit 1; }
```

### 3. IPFS Gateway (Decentralized)
```bash
curl -L -o powersOfTau28_hez_final_12.ptau \
  "https://ipfs.io/ipfs/QmTiT4eiYz5KF7gQrDsgfBDVZmCc8CPPFmzGhdXVmq8dXR?filename=powersOfTau28_hez_final_12.ptau"
echo "dcf4ea473bf14b971ce5f7b7c1d6ce1c41a8ed042cdb75b65ca9178e3a3c7c17  powersOfTau28_hez_final_12.ptau" | sha256sum -c - \
  || { echo "CHECKSUM MISMATCH — aborting"; rm -f powersOfTau28_hez_final_12.ptau; exit 1; }
```

### 4. Cloudflare IPFS Gateway
```bash
curl -L -o powersOfTau28_hez_final_12.ptau \
  "https://cloudflare-ipfs.com/ipfs/QmTiT4eiYz5KF7gQrDsgfBDVZmCc8CPPFmzGhdXVmq8dXR?filename=powersOfTau28_hez_final_12.ptau"
echo "dcf4ea473bf14b971ce5f7b7c1d6ce1c41a8ed042cdb75b65ca9178e3a3c7c17  powersOfTau28_hez_final_12.ptau" | sha256sum -c - \
  || { echo "CHECKSUM MISMATCH — aborting"; rm -f powersOfTau28_hez_final_12.ptau; exit 1; }
```

## Alternative IPFS CIDs

If the above IPFS links don't work, try these alternative CIDs:
- `QmTiT4eiYz5KF7gQrDsgfBDVZmCc8CPPFmzGhdXVmq8dXR` (powers of tau 2^12)
- Access via any IPFS gateway: https://ipfs.github.io/public-gateway-checker/

## Manual Download from GitHub

Visit these GitHub repositories and download directly:

1. **SnarkJS Builds**
   - URL: https://github.com/iden3/snarkjs/tree/master/build
   - Look for: `powersOfTau28_hez_final_12.ptau`

2. **Hermez Phase 2 Ceremony**
   - URL: https://github.com/hermeznetwork/phase2ceremony_4/tree/main/ptau
   - Download: `powersOfTau28_hez_final_12.ptau`

3. **Polygon Hermez Artifacts**
   - URL: https://github.com/0xPolygonHermez/phase2ceremony/tree/main/ptau
   - File: `powersOfTau28_hez_final_12.ptau`

## Using wget Instead of curl

If you prefer wget:
```bash
wget -O powersOfTau28_hez_final_12.ptau \
  "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau"
echo "dcf4ea473bf14b971ce5f7b7c1d6ce1c41a8ed042cdb75b65ca9178e3a3c7c17  powersOfTau28_hez_final_12.ptau" | sha256sum -c - \
  || { echo "CHECKSUM MISMATCH — aborting"; rm -f powersOfTau28_hez_final_12.ptau; exit 1; }
```

## Installation Location

After downloading, place the file in:
```
/home/user/ComplyEasyAI/server/src/zkp/powersOfTau28_hez_final_12.ptau
```

## Verify Download

Check file size (should be approximately 6.5 MB):
```bash
ls -lh powersOfTau28_hez_final_12.ptau
```

Expected output: `6.5M` or similar

## Troubleshooting

### If all downloads fail:
1. Check your internet connection
2. Verify firewall settings (ports 80/443)
3. Try using a VPN if some mirrors are blocked
4. Download on another machine and transfer via USB/SCP

### File integrity check:
```bash
sha256sum powersOfTau28_hez_final_12.ptau
```

Compare with known hash from trusted source.

## What are Powers of Tau?

Powers of Tau is a multi-party trusted setup ceremony that generates cryptographic parameters needed for zk-SNARK proof systems. The file contains pre-computed values that enable efficient zero-knowledge proofs.

- **Security:** Safe to use as long as at least one participant in the ceremony was honest
- **Public:** These files are publicly available and widely used
- **Size variants:** Different sizes (2^12, 2^14, 2^16, etc.) for different circuit complexities

## Need Help?

If you continue to have issues downloading:
1. Check the setup script has automatic fallback: `./setup-circuits.sh`
2. See QUICKSTART.md for alternative setup methods
3. Contact: Open an issue with download error details

---

**Last Updated:** 2026-01-16
**Script Version:** 1.1.0 (Multi-source fallback support)
