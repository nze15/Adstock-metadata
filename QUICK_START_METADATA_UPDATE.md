# Quick Start: Token Metadata Update Feature

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Create or update your `.env` file:
```
VITE_HELIUS_API_KEY=your_helius_api_key_here
VITE_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_key
VITE_APP_URL=http://localhost:5173
```

### 3. Start the Development Server
```bash
npm run dev
```

The application will start on:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## Using the Feature

### Step 1: Navigate to Update Tab
1. Open the app in your browser (http://localhost:5173)
2. Click the **✏️ Update** tab in the navigation

### Step 2: Connect Your Wallet
1. Click **"Select Wallet"** button
2. Choose your Solana wallet (Phantom, Solflare, etc.)
3. Approve the connection in your wallet
4. You should see your wallet address displayed

### Step 3: Enter Token Mint Address
1. Paste the token mint address (44 characters) in the "Token Mint Address" field
2. Click the **"Fetch"** button
3. Wait for the current metadata to load

### Step 4: View Current Metadata
The system will display the current metadata in the green box:
- **Name**: Current token name
- **Symbol**: Current token symbol
- **Decimals**: Token decimal places
- **Supply**: Total token supply

### Step 5: Update Metadata
1. Update any of these fields:
   - **Name** (1-32 characters)
   - **Symbol** (1-10 characters)
   - **URI** (valid HTTPS URL pointing to metadata JSON)
   - **Seller Fee Basis Points** (0-10000, where 100 = 1%)

2. Click **"Update Metadata"** button
3. A transaction will be created and sent to your wallet for signing

### Step 6: Sign Transaction
1. Your wallet will open a popup asking to approve the transaction
2. Review the transaction details
3. Click **"Approve"** to sign the transaction
4. Wait for the transaction to be processed

### Step 7: See Results
After successful update, you'll see:
- ✓ **Transaction Signature**: The blockchain confirmation
- **Shareable Link**: Copy and share with others
- **Solscan Explorer Link**: Verify on Solscan
- **Updated Metadata**: Shows the new metadata values

Click **"View on Solscan"** to see your transaction on the blockchain explorer.

## Troubleshooting

### "Wallet not connected" Error
- **Solution**: Click the wallet button and complete the connection flow
- Make sure you're using a supported wallet (Phantom, Solflare, Magic Eden, etc.)

### "Invalid mint address" Error
- **Solution**: Verify the mint address is:
  - Exactly 44 characters long
  - Valid base58 format
  - A real token on Solana mainnet

### "Mint not found" Error
- **Solution**: The mint address doesn't exist on-chain
  - Double-check the address is correct
  - Ensure you're connected to mainnet (not devnet)

### Metadata won't fetch
- **Solution**: Check that:
  - Helius API key is valid in environment variables
  - You have internet connection
  - The mint address exists on mainnet

### Transaction fails
- **Solution**: Common reasons:
  - Insufficient wallet balance for fees
  - Mint authority is not your connected wallet
  - Network connectivity issues

Try again or check the error message for more details.

### "Cannot read properties" Error
- **Solution**: Clear browser cache and refresh the page
- Make sure all environment variables are set correctly

## Important Notes

⚠️ **Before Using on Mainnet**:
1. Test with a devnet token first
2. Ensure you own the mint authority
3. Have sufficient SOL for transaction fees (~0.00143 SOL per update)
4. Understand that metadata updates are **permanent** on-chain

🔒 **Security**:
- Never share your private keys
- Always verify transaction details before signing
- Only update metadata for tokens you own

📱 **Wallet Requirements**:
- Must support signing transactions
- Must have some SOL for fees
- Must be the mint authority of the token

## API Reference

### Fetch Metadata
```bash
curl http://localhost:3001/api/token/metadata/YOUR_MINT_ADDRESS
```

### Update Metadata
```bash
curl -X POST http://localhost:3001/api/token/update-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "mint": "YOUR_MINT",
    "name": "New Name",
    "symbol": "NEW",
    "uri": "https://example.com/metadata.json",
    "sellerFeeBasisPoints": 500,
    "signedTransaction": "BASE64_ENCODED_SIGNED_TX"
  }'
```

## Support

For detailed information, see:
- `METADATA_UPDATE_FEATURE.md` - Complete implementation guide
- `.env.example` - Environment configuration template
- Solana Docs: https://docs.solana.com
- Helius Docs: https://docs.helius.xyz

## FAQ

**Q: Can I update metadata I don't own?**
A: No. You must be the mint authority to update metadata. The transaction will fail if you're not authorized.

**Q: How much does it cost?**
A: Approximately 0.00143 SOL per transaction (varies based on network congestion).

**Q: Can I undo a metadata update?**
A: Yes, by submitting another metadata update transaction with the original values.

**Q: Does this work on devnet/testnet?**
A: The current implementation is configured for mainnet. To test on devnet, update VITE_HELIUS_RPC_URL in your environment.

**Q: What's the maximum name length?**
A: 32 characters for the token name.

**Q: What's the maximum symbol length?**
A: 10 characters for the token symbol.

---

Happy updating! 🚀
