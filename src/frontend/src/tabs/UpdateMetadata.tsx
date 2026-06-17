import React, { useState } from 'react';
import { useTokenStore } from '../stores/tokenStore';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface CurrentMetadata {
  name?: string;
  symbol?: string;
  uri?: string;
  decimals?: number;
  supply?: string;
}

function UpdateMetadata() {
  const { connected, signTransaction, publicKey } = useWallet();
  const { updateMetadataState, setUpdateMetadataState, resetUpdateMetadataState } = useTokenStore();

  const [mintAddress, setMintAddress] = useState('');
  const [currentMetadata, setCurrentMetadata] = useState<CurrentMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    uri: '',
    sellerFeeBasisPoints: 0,
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch current metadata when mint address changes
  const fetchCurrentMetadata = async (mint: string) => {
    if (!mint) return;

    setLoadingMetadata(true);
    setMetadataError('');
    setCurrentMetadata(null);

    try {
      const response = await fetch(`/api/token/metadata/${mint}`);
      if (!response.ok) throw new Error('Failed to fetch metadata');

      const data = await response.json();
      if (data.success && data.data) {
        setCurrentMetadata(data.data);
        setFormData(prev => ({
          ...prev,
          name: data.data.name || '',
          symbol: data.data.symbol || '',
          uri: data.data.uri || '',
        }));
      } else {
        setMetadataError('Mint not found or metadata unavailable');
      }
    } catch (error) {
      setMetadataError((error as Error).message || 'Error fetching metadata');
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleFetchMetadata = () => {
    if (!mintAddress.trim()) {
      setMetadataError('Please enter a mint address');
      return;
    }
    fetchCurrentMetadata(mintAddress.trim());
  };

  const validateForm = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!mintAddress || mintAddress.length !== 44) {
      errors.push('Invalid mint address format');
    }

    if (!formData.name || formData.name.length < 1 || formData.name.length > 32) {
      errors.push('Name must be 1-32 characters');
    }

    if (!formData.symbol || formData.symbol.length < 1 || formData.symbol.length > 10) {
      errors.push('Symbol must be 1-10 characters');
    }

    try {
      const url = new URL(formData.uri);
      if (!url.protocol.startsWith('http')) {
        errors.push('URI must be a valid HTTPS URL');
      }
    } catch {
      errors.push('URI must be a valid URL');
    }

    if (typeof formData.sellerFeeBasisPoints !== 'number' || formData.sellerFeeBasisPoints < 0 || formData.sellerFeeBasisPoints > 10000) {
      errors.push('Seller fee basis points must be between 0 and 10000');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !signTransaction) {
      setUpdateMetadataState({
        ...updateMetadataState,
        updateStatus: 'failed',
        updateError: 'Wallet not connected',
      });
      return;
    }

    const validation = validateForm();
    if (!validation.valid) {
      setUpdateMetadataState({
        ...updateMetadataState,
        updateStatus: 'failed',
        updateError: validation.errors.join('; '),
      });
      return;
    }

    setUpdateMetadataState({
      ...updateMetadataState,
      isUpdating: true,
      updateStatus: 'pending',
      updateError: undefined,
    });

    try {
      // For now, we'll create a placeholder transaction
      // In a real implementation, you'd construct the actual metadata update instruction
      // using @metaplex-foundation/mpl-token-metadata-kit

      // Mock signed transaction for demonstration
      const mockSignedTx = Buffer.from([0]).toString('base64');

      const response = await fetch('/api/token/update-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mint: mintAddress,
          name: formData.name,
          symbol: formData.symbol,
          uri: formData.uri,
          sellerFeeBasisPoints: formData.sellerFeeBasisPoints,
          signedTransaction: mockSignedTx,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUpdateMetadataState({
          ...updateMetadataState,
          isUpdating: false,
          updateStatus: 'success',
          updateSignature: result.signature,
          updateShareableUrl: result.shareableUrl,
          updateSolscanUrl: result.solscanUrl,
          updateError: undefined,
        });
      } else {
        setUpdateMetadataState({
          ...updateMetadataState,
          isUpdating: false,
          updateStatus: 'failed',
          updateError: result.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      setUpdateMetadataState({
        ...updateMetadataState,
        isUpdating: false,
        updateStatus: 'failed',
        updateError: (error as Error).message,
      });
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <div className="border border-gray-800 rounded-lg p-6 bg-gray-900/30">
        <h3 className="text-lg font-semibold mb-4">Wallet Connection</h3>
        <div className="flex items-center justify-between">
          <div>
            {connected && publicKey ? (
              <div>
                <p className="text-green-400 font-medium">✓ Connected</p>
                <p className="text-sm text-gray-400 mt-1">{publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-4)}</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-400">Please connect your Solana wallet</p>
              </div>
            )}
          </div>
          <WalletMultiButton />
        </div>
      </div>

      {/* Mint Address Input */}
      <div className="border border-gray-800 rounded-lg p-6 bg-gray-900/30">
        <h3 className="text-lg font-semibold mb-4">Token Mint Address</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={mintAddress}
            onChange={(e) => {
              setMintAddress(e.target.value);
              setCurrentMetadata(null);
              setMetadataError('');
            }}
            placeholder="Enter mint address (44 characters)"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-green-400"
          />
          <button
            onClick={handleFetchMetadata}
            disabled={loadingMetadata}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMetadata ? 'Loading...' : 'Fetch'}
          </button>
        </div>
        {metadataError && <p className="text-red-400 text-sm mt-2">{metadataError}</p>}
      </div>

      {/* Current Metadata Preview */}
      {currentMetadata && (
        <div className="border border-green-900/50 bg-green-900/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-400">Current Metadata</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Name</p>
              <p className="font-mono text-sm mt-1">{currentMetadata.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Symbol</p>
              <p className="font-mono text-sm mt-1">{currentMetadata.symbol || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Decimals</p>
              <p className="font-mono text-sm mt-1">{currentMetadata.decimals || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Supply</p>
              <p className="font-mono text-sm mt-1">{currentMetadata.supply || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Update Form */}
      {currentMetadata && (
        <form onSubmit={handleSubmit} className="border border-gray-800 rounded-lg p-6 bg-gray-900/30 space-y-4">
          <h3 className="text-lg font-semibold mb-4">Update Metadata</h3>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={32}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-green-400"
              placeholder="Token name"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.name.length}/32 characters</p>
          </div>

          {/* Symbol Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              maxLength={10}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-green-400"
              placeholder="Token symbol"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.symbol.length}/10 characters</p>
          </div>

          {/* URI Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Metadata URI</label>
            <input
              type="text"
              value={formData.uri}
              onChange={(e) => setFormData({ ...formData, uri: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-green-400"
              placeholder="https://example.com/metadata.json"
            />
            <p className="text-xs text-gray-500 mt-1">Must be a valid HTTPS URL</p>
          </div>

          {/* Seller Fee Basis Points */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Seller Fee Basis Points</label>
            <input
              type="number"
              value={formData.sellerFeeBasisPoints}
              onChange={(e) => setFormData({ ...formData, sellerFeeBasisPoints: parseInt(e.target.value) })}
              min={0}
              max={10000}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-green-400"
              placeholder="0-10000"
            />
            <p className="text-xs text-gray-500 mt-1">0-10000 (0-100%), 100 = 1%</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={updateMetadataState.isUpdating || !connected}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMetadataState.isUpdating ? 'Updating...' : 'Update Metadata'}
          </button>
        </form>
      )}

      {/* Status Messages */}
      {updateMetadataState.updateStatus === 'pending' && (
        <div className="border border-blue-900/50 bg-blue-900/10 rounded-lg p-4 text-blue-400">
          <p className="font-medium">Processing transaction...</p>
          <p className="text-sm mt-1">Please wait while your metadata update is being processed.</p>
        </div>
      )}

      {updateMetadataState.updateStatus === 'success' && (
        <div className="border border-green-900/50 bg-green-900/10 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-green-400">✓ Metadata Updated Successfully!</h3>

          {updateMetadataState.updateSignature && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Transaction Signature</p>
              <div className="flex items-center justify-between bg-gray-800 rounded p-3">
                <p className="font-mono text-sm break-all">{updateMetadataState.updateSignature.slice(0, 20)}...</p>
                <button
                  onClick={() => copyToClipboard(updateMetadataState.updateSignature || '', 'signature')}
                  className="ml-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                >
                  {copiedField === 'signature' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {updateMetadataState.updateShareableUrl && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Shareable Link</p>
              <div className="flex items-center justify-between bg-gray-800 rounded p-3">
                <p className="font-mono text-sm break-all">{updateMetadataState.updateShareableUrl.slice(0, 50)}...</p>
                <button
                  onClick={() => copyToClipboard(updateMetadataState.updateShareableUrl || '', 'link')}
                  className="ml-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                >
                  {copiedField === 'link' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {updateMetadataState.updateSolscanUrl && (
            <div>
              <a
                href={updateMetadataState.updateSolscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
              >
                View on Solscan →
              </a>
            </div>
          )}

          <button
            onClick={resetUpdateMetadataState}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium"
          >
            Update Another Token
          </button>
        </div>
      )}

      {updateMetadataState.updateStatus === 'failed' && (
        <div className="border border-red-900/50 bg-red-900/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-400">✗ Update Failed</h3>
          <p className="text-red-300 mt-2">{updateMetadataState.updateError}</p>
          <button
            onClick={resetUpdateMetadataState}
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default UpdateMetadata;
