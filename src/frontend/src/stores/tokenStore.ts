import { create } from 'zustand';

interface UpdateMetadataState {
  isUpdating: boolean;
  updateStatus: 'idle' | 'pending' | 'success' | 'failed';
  updateSignature?: string;
  updateShareableUrl?: string;
  updateSolscanUrl?: string;
  updateError?: string;
}

interface TokenStore {
  tokenMint: string;
  metadata: any;
  verification: any;
  insights: any;
  holders: number;
  transactions: any[];
  trustScore: number;
  lastUpdated: number;
  updateMetadataState: UpdateMetadataState;
  setTokenMint: (mint: string) => void;
  setMetadata: (metadata: any) => void;
  setVerification: (verification: any) => void;
  setInsights: (insights: any) => void;
  setHolders: (holders: number) => void;
  setTransactions: (transactions: any[]) => void;
  setTrustScore: (score: number) => void;
  updateLastUpdated: () => void;
  setUpdateMetadataState: (state: UpdateMetadataState) => void;
  resetUpdateMetadataState: () => void;
}

export const useTokenStore = create<TokenStore>((set) => ({
  tokenMint: import.meta.env.VITE_TOKEN_MINT || 'HTEjWCCRSUnp2nHdiAEoVPJDDaWYcRozmZUCRsREBAGS',
  metadata: null,
  verification: null,
  insights: null,
  holders: 0,
  transactions: [],
  trustScore: 0,
  lastUpdated: 0,
  updateMetadataState: {
    isUpdating: false,
    updateStatus: 'idle',
  },
  setTokenMint: (mint) => set({ tokenMint: mint }),
  setMetadata: (metadata) => set({ metadata }),
  setVerification: (verification) => set({ verification }),
  setInsights: (insights) => set({ insights }),
  setHolders: (holders) => set({ holders }),
  setTransactions: (transactions) => set({ transactions }),
  setTrustScore: (score) => set({ trustScore: score }),
  updateLastUpdated: () => set({ lastUpdated: Date.now() }),
  setUpdateMetadataState: (updateMetadataState) => set({ updateMetadataState }),
  resetUpdateMetadataState: () => set({
    updateMetadataState: {
      isUpdating: false,
      updateStatus: 'idle',
    },
  }),
}));
