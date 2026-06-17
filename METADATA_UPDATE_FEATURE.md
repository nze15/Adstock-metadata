# Token Metadata Update Feature - Implementation Guide

## Overview
This document describes the complete implementation of the Solana Token Metadata Update feature that enables users to update and upgrade token metadata live on mainnet.

## Feature Summary
- **Purpose**: Allow users to update Solana token metadata (name, symbol, URI, seller fee) with wallet authentication
- **Authorization**: Connect wallet + enter mint address (user must own the mint authority)
- **Output**: Transaction signature, shareable link, and Solscan explorer link
- **Status Display**: Real-time transaction status, success/failure messages

## Implemented Components

### 1. Backend Services

#### **metadataUpdateService.ts**
Location: `/src/backend/services/metadataUpdateService.ts`

Key functions:
- `validateMetadataFields()` - Validates input metadata fields (name, symbol, URI, seller fee)
  - Name: 1-32 characters
  - Symbol: 1-10 characters  
  - URI: Valid HTTPS URL
  - Seller Fee: 0-10000 basis points
  
- `validateMintExists()` - Checks if mint address exists on-chain
  
- `generateShareableLink()` - Creates a shareable URL with transaction signature
  
- `getSolscanLink()` - Generates Solscan explorer link for verification
  
- `broadcastMetadataUpdateTransaction()` - Sends signed transaction to blockchain via Helius RPC
  
- `getUpdatedMetadata()` - Fetches updated metadata from Helius after successful update
  
- `processMetadataUpdate()` - Main orchestration function that handles the complete update flow

#### **tokenRoutes.ts** (Modified)
Added new endpoint:
- `POST /api/token/update-metadata` - Accepts metadata update requests
  - Request body: `{ mint, name, symbol, uri, sellerFeeBasisPoints, signedTransaction }`
  - Response: `{ success, signature, shareableUrl, solscanUrl, updatedMetadata, error }`

### 2. Frontend Components

#### **UpdateMetadata.tsx** (New Tab)
Location: `/src/frontend/src/tabs/UpdateMetadata.tsx`

Sections:
1. **Wallet Connection Panel**
   - Displays wallet connection status
   - WalletMultiButton for wallet selection
   - Shows connected wallet address (truncated)

2. **Mint Address Input**
   - Input field for 44-character mint address
   - "Fetch" button to retrieve current metadata
   - Error messages for invalid addresses

3. **Current Metadata Preview**
   - Green-bordered box showing existing metadata
   - Displays: Name, Symbol, Decimals, Supply
   - Appears after successful metadata fetch

4. **Update Form**
   - Input fields for: Name, Symbol, URI, Seller Fee Basis Points
   - Character counters for name and symbol
   - Validation messages inline
   - Submit button (disabled when not connected)

5. **Status Display**
   - Pending state: "Processing transaction..." message
   - Success state: Shows signature, shareable link, Solscan button
   - Failed state: Shows error message with retry button

#### **tokenStore.ts** (Modified)
Added state for metadata updates:
```typescript
updateMetadataState: {
  isUpdating: boolean
  updateStatus: 'idle' | 'pending' | 'success' | 'failed'
  updateSignature?: string
  updateShareableUrl?: string
  updateSolscanUrl?: string
  updateError?: string
}
```

Methods:
- `setUpdateMetadataState()` - Update the state
- `resetUpdateMetadataState()` - Reset to initial state

#### **App.tsx** (Modified)
- Added UpdateMetadata import
- Added 'update' to Tab type
- Added "✏️ Update" tab to navigation
- Renders UpdateMetadata component when activeTab === 'update'

## Transaction Flow

```
User connects wallet
    ↓
User enters mint address
    ↓
Frontend fetches current metadata via /api/token/metadata/:mint
    ↓
Metadata preview displays with current values
    ↓
User updates metadata fields in form
    ↓
User clicks "Update Metadata" button
    ↓
Frontend validates all fields
    ↓
Frontend creates transaction (using Solana Kit)
    ↓
User signs transaction in wallet
    ↓
Frontend sends signed transaction to /api/token/update-metadata
    ↓
Backend validates fields again
    ↓
Backend validates mint exists
    ↓
Backend broadcasts transaction via Helius RPC
    ↓
Backend waits for transaction confirmation
    ↓
Backend generates shareable link and Solscan URL
    ↓
Backend fetches updated metadata from Helius
    ↓
Frontend displays success with:
  - Transaction signature
  - Copy-to-clipboard buttons
  - Shareable link
  - Solscan explorer link
  - Button to update another token
```

## Security Considerations

### Implemented
- ✓ Input validation on both frontend and backend
- ✓ Mint address validation (format and on-chain existence)
- ✓ No private key handling - wallet handles signing
- ✓ Transaction signature verification before broadcasting
- ✓ HTTPS-only metadata URIs required

### Future Enhancements
- Add rate limiting to /api/token/update-metadata endpoint
- Implement CORS whitelist for production
- Add signature expiration validation
- Implement request signing/verification for API calls

## Configuration & Environment

### Required Environment Variables
- `VITE_HELIUS_API_KEY` - Helius RPC API key
- `VITE_HELIUS_RPC_URL` - Helius mainnet RPC endpoint
- `VITE_APP_URL` - Application URL (for shareable links) - defaults to http://localhost:5173

### Dependencies
All required packages are in package.json:
- `@solana/kit` - Transaction building and signing
- `@solana/wallet-adapter-react` - Wallet integration
- `@solana/wallet-adapter-react-ui` - Wallet UI components
- `@solana/web3.js` - Solana blockchain interaction
- `axios` - HTTP client for backend

## Testing Checklist

### Local Testing
- [ ] Start dev server: `npm run dev`
- [ ] Frontend loads successfully on http://localhost:5173
- [ ] Backend API running on http://localhost:3001

### Feature Testing
- [ ] Wallet connection works (use Phantom/Solflare)
- [ ] Mint address fetch retrieves metadata correctly
- [ ] Form validation catches invalid inputs
- [ ] Invalid mint address shows appropriate error
- [ ] All form fields are required before submit
- [ ] Transaction submission shows pending state
- [ ] Success response displays signature and links
- [ ] Shareable link is copyable
- [ ] Solscan link opens in new tab
- [ ] Error states show helpful messages

### Edge Cases
- [ ] Empty mint address shows error
- [ ] Mint address of wrong format shows error
- [ ] Non-existent mint address shows error
- [ ] Wallet disconnects during transaction
- [ ] Network timeout handling
- [ ] Name/symbol/URI validation edge cases

## Limitations & Future Work

### Current Limitations
1. **Transaction Construction**: Currently uses a mock signed transaction. In production, you'd need to:
   - Use `@metaplex-foundation/mpl-token-metadata-kit` to create actual metadata update instructions
   - Build transaction with correct fee payer and blockhash
   - Handle wallet-based signing properly

2. **Transaction Fee**: No fee estimation UI yet
   - Future: Add priority fee slider
   - Future: Show estimated fees before signing

3. **Metadata Caching**: Basic caching not yet implemented
   - Future: Cache metadata for 5 minutes
   - Future: Invalidate cache after successful updates

### Phase 2 Features
- [ ] Bulk token metadata updates
- [ ] Transaction history for a mint
- [ ] Metadata preview from JSON URI
- [ ] Priority fee adjustment UI
- [ ] Metadata change notifications
- [ ] Undo/rollback capability

## API Endpoints

### GET /api/token/metadata/:mint
Fetches current token metadata from Helius

**Response:**
```json
{
  "success": true,
  "data": {
    "mint": "...",
    "name": "Token Name",
    "symbol": "TKN",
    "decimals": 9,
    "uri": "https://...",
    "supply": "1000000"
  }
}
```

### POST /api/token/update-metadata
Updates token metadata on-chain

**Request:**
```json
{
  "mint": "44-char mint address",
  "name": "New Name",
  "symbol": "NEW",
  "uri": "https://example.com/metadata.json",
  "sellerFeeBasisPoints": 500,
  "signedTransaction": "base64-encoded signed transaction"
}
```

**Success Response:**
```json
{
  "success": true,
  "signature": "transaction signature",
  "shareableUrl": "http://localhost:5173/metadata-update/signature",
  "solscanUrl": "https://solscan.io/tx/signature?cluster=mainnet",
  "updatedMetadata": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "descriptive error message"
}
```

## Debugging Tips

1. **Check Helius API Key**: Verify VITE_HELIUS_API_KEY is set in environment
2. **Mint Address Format**: Must be exactly 44 characters, valid base58
3. **Transaction Errors**: Check browser console and server logs for detailed error messages
4. **Wallet Connection**: Ensure wallet is connected before attempting update
5. **Network Issues**: Test RPC connectivity with health check endpoint

## Code Organization

```
src/
├── backend/
│   ├── services/
│   │   └── metadataUpdateService.ts (NEW)
│   ├── routes/
│   │   └── tokenRoutes.ts (MODIFIED - added POST endpoint)
│   └── config/
│       └── solana.ts
├── frontend/
│   └── src/
│       ├── tabs/
│       │   └── UpdateMetadata.tsx (NEW)
│       ├── stores/
│       │   └── tokenStore.ts (MODIFIED - added update state)
│       └── App.tsx (MODIFIED - added tab)
```

## Next Steps

1. **Implement actual transaction building**: Replace mock transaction with real Metaplex metadata update instruction
2. **Test with devnet first**: Create test token and validate flow on devnet
3. **Add fee estimation**: Show estimated fees before user signs
4. **Implement caching**: Cache metadata to reduce API calls
5. **Add monitoring**: Track metadata update success/failure rates
6. **Security audit**: Review for potential vulnerabilities before mainnet use

---

For issues or questions, refer to:
- Solana Documentation: https://docs.solana.com
- Metaplex Token Metadata: https://docs.metaplex.com
- Helius API: https://docs.helius.xyz
