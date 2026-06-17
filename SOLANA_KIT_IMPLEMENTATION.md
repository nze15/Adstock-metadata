# Solana Kit Implementation Guide - AdStock Metadata Updates

## Complete Transaction Building

### 1. Frontend Transaction Builder

In `UpdateMetadata.tsx`, replace the `buildAndSignTransaction` function with:

```typescript
const buildAndSignTransaction = async (): Promise<string | null> => {
  if (!signTransaction || !publicKey) {
    throw new Error('Wallet not properly connected');
  }

  try {
    // Setup Solana Kit RPC
    const rpc = createSolanaRpc(getHeliusRpcUrl());
    const mintAddress = new PublicKey(mintAddress);

    // Fetch current metadata to preserve creators
    const [metadataAddress] = await findMetadataPda({ mint: mintAddress });
    const currentMetadata = await fetchMetadata(rpc, metadataAddress);

    // Build update instruction
    const updateInstruction = await getUpdateV1InstructionAsync({
      mint: mintAddress,
      authority: publicKey,
      payer: publicKey,
      data: {
        name: formData.name,
        symbol: formData.symbol,
        uri: formData.uri,
        sellerFeeBasisPoints: formData.sellerFeeBasisPoints,
        creators:
          currentMetadata.data.creators.__option === 'Some'
            ? currentMetadata.data.creators.value
            : null,
      },
    });

    // Get blockhash
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    // Build transaction with Solana Kit pipes
    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(publicKey, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions([updateInstruction], tx)
    );

    // Sign with wallet adapter
    const signedTransaction = await signTransaction([transactionMessage]);
    const base64 = Buffer.from(signedTransaction.serialize()).toString('base64');

    return base64;
  } catch (error) {
    throw new Error(`Transaction build failed: ${(error as Error).message}`);
  }
};
```

### 2. Backend Broadcasting

The backend receives the base64-encoded signed transaction and broadcasts:

```typescript
// From metadataUpdateService.ts
export async function broadcastSignedTransaction(
  signedTransactionBase64: string
): Promise<string> {
  const rpc = createSolanaRpc(getHeliusRpcUrl());
  const rpcSubscriptions = createSolanaRpcSubscriptions(
    getHeliusRpcUrl().replace('https://', 'wss://')
  );

  // Deserialize transaction
  const buffer = Buffer.from(signedTransactionBase64, 'base64');
  const signedTx = await rpc.sendTransaction(buffer);

  // Confirm
  const confirmFn = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  const signature = await confirmFn(signedTx, { commitment: 'confirmed' });
  return signature;
}
```

## API Endpoint: POST /api/token/update-metadata

Receives:
- `mint` - Token mint address
- `name` - New name (1-32 chars)
- `symbol` - New symbol (1-10 chars)
- `uri` - Metadata URI (HTTPS)
- `sellerFeeBasisPoints` - Royalty percentage (0-10000)
- `signedTransaction` - Base64 encoded signed transaction

Returns:
```json
{
  "success": true,
  "signature": "transaction_signature_here",
  "shareableUrl": "https://yourdomain.com/metadata-update/signature",
  "solscanUrl": "https://solscan.io/tx/signature?cluster=mainnet",
  "updatedMetadata": {
    "mint": "...",
    "name": "New Name",
    "symbol": "NEW",
    "uri": "https://..."
  }
}
```

## Environment Setup

Required `.env` variables:
```bash
VITE_HELIUS_API_KEY=your_key_here
VITE_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_key_here
VITE_APP_URL=http://localhost:5173
```

## Feature Implementation Checklist

✓ Wallet connection via WalletAdapter
✓ Mint address validation
✓ Current metadata fetching
✓ Transaction building with Solana Kit
✓ Wallet signing
✓ Transaction broadcasting via Helius
✓ Transaction confirmation
✓ Shareable link generation
✓ Solscan explorer integration
✓ Complete error handling
✓ Form validation (client & server)
✓ Responsive UI with real-time status

## Data Flow

1. User connects wallet → 2. Enters mint address → 3. Fetches current metadata → 4. Updates fields
5. Submits form → 6. Frontend builds transaction → 7. Wallet signs → 8. Backend broadcasts
9. Transaction confirmed → 10. Links generated → 11. Success display

## Security Model

- Private keys never leave wallet
- All transactions signed by wallet adapter
- Server validates all inputs before broadcasting
- HTTPS-only metadata URIs
- Transaction verification on broadcast
- Detailed error handling without data leakage

## Testing

Test with AdStock token:
```
HTEjWCCRSUnp2nHdiAEoVPJDDaWYcRozmZUCRsREBAGS
```

Ensure connected wallet is the update authority.
