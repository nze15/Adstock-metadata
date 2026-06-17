import { Connection, PublicKey, VersionedTransaction, TransactionMessage } from '@solana/web3.js';
import { solanaConnection, solanaConfig } from '../config/solana';
import axios from 'axios';

interface MetadataUpdateRequest {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
}

interface MetadataUpdateResponse {
  success: boolean;
  signature?: string;
  shareableUrl?: string;
  solscanUrl?: string;
  updatedMetadata?: MetadataUpdateRequest;
  error?: string;
}

export function validateMetadataFields(data: MetadataUpdateRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate mint address format (44-character base58)
  if (!data.mint || data.mint.length !== 44) {
    errors.push('Invalid mint address format');
  }

  // Validate name (1-32 characters)
  if (!data.name || data.name.length < 1 || data.name.length > 32) {
    errors.push('Name must be 1-32 characters');
  }

  // Validate symbol (1-10 characters)
  if (!data.symbol || data.symbol.length < 1 || data.symbol.length > 10) {
    errors.push('Symbol must be 1-10 characters');
  }

  // Validate URI (valid HTTPS URL)
  try {
    const url = new URL(data.uri);
    if (!url.protocol.startsWith('http')) {
      errors.push('URI must be a valid HTTPS URL');
    }
  } catch {
    errors.push('URI must be a valid URL');
  }

  // Validate seller fee basis points (0-10000)
  if (typeof data.sellerFeeBasisPoints !== 'number' || data.sellerFeeBasisPoints < 0 || data.sellerFeeBasisPoints > 10000) {
    errors.push('Seller fee basis points must be between 0 and 10000');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function validateMintExists(mint: string): Promise<boolean> {
  try {
    const mintPubkey = new PublicKey(mint);
    const accountInfo = await solanaConnection.getAccountInfo(mintPubkey);
    return accountInfo !== null;
  } catch {
    return false;
  }
}

export function generateShareableLink(signature: string): string {
  const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
  return `${baseUrl}/metadata-update/${signature}`;
}

export function getSolscanLink(signature: string): string {
  return `https://solscan.io/tx/${signature}?cluster=mainnet`;
}

export async function broadcastMetadataUpdateTransaction(
  signedTransactionBase64: string
): Promise<string> {
  try {
    // Parse the signed transaction
    const transactionBuffer = Buffer.from(signedTransactionBase64, 'base64');
    const transaction = VersionedTransaction.deserialize(transactionBuffer);

    // Get the latest blockhash to ensure transaction can be processed
    const { blockhash } = await solanaConnection.getLatestBlockhash('finalized');
    transaction.message.recentBlockhash = blockhash;

    // Broadcast via Helius RPC
    const signature = await solanaConnection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    // Wait for confirmation
    const confirmation = await solanaConnection.confirmTransaction(signature, 'confirmed');
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    return signature;
  } catch (error) {
    console.error('Error broadcasting transaction:', error);
    throw new Error(`Failed to broadcast transaction: ${(error as Error).message}`);
  }
}

export async function getUpdatedMetadata(mint: string): Promise<any> {
  try {
    const response = await axios.post(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.VITE_HELIUS_API_KEY}`,
      {
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getAsset',
        params: {
          id: mint,
        },
      }
    );

    const asset = response.data?.result;
    if (!asset) {
      return null;
    }

    return {
      mint,
      name: asset.content?.metadata?.name,
      symbol: asset.content?.metadata?.symbol,
      decimals: asset.decimals,
      uri: asset.content?.links?.image,
      supply: asset.supply?.display_value,
    };
  } catch (error) {
    console.error('Error fetching updated metadata:', error);
    return null;
  }
}

export async function processMetadataUpdate(
  updateRequest: MetadataUpdateRequest,
  signedTransactionBase64: string
): Promise<MetadataUpdateResponse> {
  try {
    // Validate input
    const validation = validateMetadataFields(updateRequest);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('; '),
      };
    }

    // Check if mint exists
    const mintExists = await validateMintExists(updateRequest.mint);
    if (!mintExists) {
      return {
        success: false,
        error: 'Mint address not found on chain',
      };
    }

    // Broadcast the signed transaction
    const signature = await broadcastMetadataUpdateTransaction(signedTransactionBase64);

    // Generate links
    const shareableUrl = generateShareableLink(signature);
    const solscanUrl = getSolscanLink(signature);

    // Get updated metadata
    const updatedMetadata = await getUpdatedMetadata(updateRequest.mint);

    return {
      success: true,
      signature,
      shareableUrl,
      solscanUrl,
      updatedMetadata,
    };
  } catch (error) {
    console.error('Error processing metadata update:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export default {
  validateMetadataFields,
  validateMintExists,
  generateShareableLink,
  getSolscanLink,
  broadcastMetadataUpdateTransaction,
  getUpdatedMetadata,
  processMetadataUpdate,
};
