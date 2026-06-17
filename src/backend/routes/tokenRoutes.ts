import express from 'express';
import {
  getTokenMetadataViaHelius,
  getMintAccountInfo,
  getTokenHolders,
  calculateTrustScore,
} from '../services/tokenMetadataService';
import { getRecentTransactions, getEnrichedTransactions } from '../services/transactionService';
import { generateTokenInsights } from '../services/insightService';
import { processMetadataUpdate } from '../services/metadataUpdateService';

const router = express.Router();

router.get('/metadata/:mint', async (req, res) => {
  try {
    const { mint } = req.params;
    const metadata = await getTokenMetadataViaHelius(mint);
    res.json({ success: true, data: metadata });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/verify/:mint', async (req, res) => {
  try {
    const { mint } = req.params;
    const [metadata, mintInfo, holders] = await Promise.all([
      getTokenMetadataViaHelius(mint),
      getMintAccountInfo(mint),
      getTokenHolders(mint),
    ]);

    const trustScore = calculateTrustScore({ ...metadata, ...mintInfo });

    res.json({
      success: true,
      data: {
        metadata,
        authorities: mintInfo,
        holders,
        trustScore,
        isVerified: trustScore >= 70,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/transactions/:mint', async (req, res) => {
  try {
    const { mint } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const transactions = await getEnrichedTransactions(mint, limit);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/insights/:mint', async (req, res) => {
  try {
    const { mint } = req.params;
    const [metadata, mintInfo, holders, transactions] = await Promise.all([
      getTokenMetadataViaHelius(mint),
      getMintAccountInfo(mint),
      getTokenHolders(mint),
      getEnrichedTransactions(mint, 100),
    ]);

    const insights = await generateTokenInsights({ ...metadata, ...mintInfo }, transactions, holders);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/update-metadata', async (req, res) => {
  try {
    const { mint, name, symbol, uri, sellerFeeBasisPoints, signedTransaction } = req.body;

    if (!signedTransaction) {
      return res.status(400).json({
        success: false,
        error: 'Signed transaction is required',
      });
    }

    const result = await processMetadataUpdate(
      { mint, name, symbol, uri, sellerFeeBasisPoints },
      signedTransaction
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
