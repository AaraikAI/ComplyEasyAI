# Homomorphic AI User Guide

## Overview

Homomorphic AI enables privacy-preserving machine learning operations on encrypted data. This means you can perform computations, statistical analysis, and even run neural networks on data without ever decrypting it, ensuring complete privacy and security.

## Features

### 1. Key Generation
Generate encryption keys for homomorphic operations:
- **BFV Scheme**: For integer arithmetic
- **CKKS Scheme**: For floating-point arithmetic
- **Security Levels**: 128-bit, 192-bit, or 256-bit

### 2. Encryption/Decryption
- Encrypt numerical data arrays
- Decrypt encrypted data back to plaintext
- Support for both BFV and CKKS schemes

### 3. Encrypted Linear Regression
Perform linear regression on encrypted data:
- Model: `y = w0 + w1*x1 + w2*x2 + ... + wn*xn`
- All operations performed on encrypted data
- Results remain encrypted

### 4. Encrypted Statistics
Compute statistical measures on encrypted data:
- Mean calculation
- Variance calculation
- Results remain encrypted

### 5. Encrypted Neural Network Inference
Run neural network inference on encrypted data:
- Supports shallow networks (2 layers)
- Uses polynomial approximations for activation functions
- Complete privacy preservation

## How to Use

### Accessing Homomorphic AI

1. Navigate to **aCOS Dashboard**
2. Click on the **Homomorphic AI** tab
3. Click **"Open Full Interface"** to access all features

### Step-by-Step: Basic Encryption Workflow

1. **Generate Keys**
   - Select scheme (BFV for integers, CKKS for floating-point)
   - Choose security level (128-bit recommended for most use cases)
   - Click "Generate Keys"
   - **Important**: Save your keys securely! You'll need the secret key to decrypt data.

2. **Encrypt Data**
   - Enter comma-separated numbers (e.g., `1.5, 2.5, 3.5, 4.5`)
   - Select encryption scheme (must match key scheme)
   - Click "Encrypt Data"
   - Copy and save the encrypted result

3. **Decrypt Data**
   - Paste the encrypted data JSON
   - Ensure you have the matching secret key
   - Click "Decrypt Data"
   - View the decrypted result

### Step-by-Step: Encrypted Linear Regression

1. **Prepare Your Data**
   - Features: Input values (e.g., `1.0, 2.0, 3.0`)
   - Weights: Model coefficients (e.g., `0.5, 1.0, 0.3`)

2. **Run Regression**
   - Enter features in the "Features" field
   - Enter weights in the "Weights" field
   - Click "Run Linear Regression"
   - The system will:
     - Encrypt your features
     - Perform regression on encrypted data
     - Return encrypted result

3. **Decrypt Result** (if needed)
   - Use the decrypt tab with your secret key

### Step-by-Step: Encrypted Statistics

1. **Prepare Data**
   - Enter comma-separated numbers (e.g., `1.5, 2.5, 3.5, 4.5, 5.5`)

2. **Compute Statistics**
   - Click "Compute Statistics"
   - The system will:
     - Encrypt your data
     - Compute mean and variance on encrypted data
     - Return encrypted results

3. **Note**: Statistics results are encrypted. To view actual values, decrypt using the Decrypt tab.

### Step-by-Step: Encrypted Neural Network

1. **Prepare Input**
   - Enter input values as comma-separated numbers

2. **Prepare Model Weights**
   - Format as JSON:
     ```json
     {
       "layer1": [[0.5, 0.3]],
       "layer2": [[0.2]],
       "biases1": [0.1],
       "biases2": [0.05]
     }
     ```

3. **Run Inference**
   - Click "Run Neural Network"
   - The system performs inference on encrypted data
   - Returns encrypted result

## API Endpoints

### Generate Keys
```http
POST /api/acos/homomorphic/keys/generate
Content-Type: application/json

{
  "scheme": "CKKS",
  "securityLevel": 128
}
```

### Encrypt Data
```http
POST /api/acos/homomorphic/encrypt
Content-Type: application/json

{
  "data": [1.5, 2.5, 3.5],
  "publicKey": "...",
  "scheme": "CKKS"
}
```

### Decrypt Data
```http
POST /api/acos/homomorphic/decrypt
Content-Type: application/json

{
  "encryptedData": {
    "ciphertext": "...",
    "contextParams": {...},
    "scheme": "CKKS"
  },
  "secretKey": "..."
}
```

### Linear Regression
```http
POST /api/acos/homomorphic/linear-regression
Content-Type: application/json

{
  "encryptedFeatures": {...},
  "weights": [0.5, 1.0, 0.3],
  "publicKey": "...",
  "relinKeys": "..."
}
```

### Statistics
```http
POST /api/acos/homomorphic/statistics
Content-Type: application/json

{
  "encryptedData": {...},
  "galoisKeys": "...",
  "relinKeys": "..."
}
```

### Neural Network
```http
POST /api/acos/homomorphic/neural-network
Content-Type: application/json

{
  "encryptedInput": {...},
  "modelWeights": {
    "layer1": [[...]],
    "layer2": [[...]],
    "biases1": [...],
    "biases2": [...]
  },
  "keys": {
    "publicKey": "...",
    "relinKeys": "...",
    "galoisKeys": "..."
  }
}
```

## Security Best Practices

1. **Key Management**
   - Store keys securely (use a key management system in production)
   - Never share secret keys
   - Rotate keys periodically

2. **Data Handling**
   - Always use HTTPS for API calls
   - Validate input data before encryption
   - Handle encrypted data carefully

3. **Performance**
   - Homomorphic encryption is computationally intensive
   - Use appropriate security levels (128-bit is usually sufficient)
   - Consider data size limitations

## Use Cases

1. **Privacy-Preserving Analytics**
   - Analyze sensitive data without exposing it
   - Share encrypted data for collaborative analysis

2. **Secure Machine Learning**
   - Train models on encrypted data
   - Deploy models that work on encrypted inputs

3. **Compliance**
   - Process regulated data (GDPR, HIPAA) while maintaining privacy
   - Enable data sharing for compliance without exposing sensitive information

## Limitations

1. **Performance**: Homomorphic operations are slower than plaintext operations
2. **Data Size**: Limited by encryption scheme parameters
3. **Operations**: Not all operations are supported (only addition, multiplication, and polynomial evaluation)
4. **Noise**: Operations add "noise" to encrypted data; too many operations may require decryption and re-encryption

## Troubleshooting

### "Failed to generate keys"
- Ensure node-seal library is properly installed
- Check server logs for detailed error messages

### "Failed to encrypt data"
- Verify your public key is correct
- Ensure data array is not empty
- Check that scheme matches key scheme

### "Failed to decrypt data"
- Verify encrypted data format is correct JSON
- Ensure secret key matches the public key used for encryption
- Check that scheme matches

### Performance Issues
- Reduce security level (128-bit is usually sufficient)
- Reduce data size
- Consider using BFV for integer-only operations

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Review API documentation
3. Contact support with error details and steps to reproduce

---

**Last Updated**: 2025-01-28

