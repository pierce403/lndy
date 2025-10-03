// Vercel Serverless Function for handling notification subscriptions
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fid, notificationToken, walletAddress } = req.body;

    if (!fid || !notificationToken || !walletAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: fid, notificationToken, walletAddress' 
      });
    }

    // Store the notification token in Vercel KV (Redis)
    // For now, we'll use a simple in-memory store for demo
    // In production, you'd use Vercel KV or a database
    
    console.log('📝 Storing notification subscription:', {
      fid,
      walletAddress,
      timestamp: new Date().toISOString()
    });

    // TODO: Store in Vercel KV
    // await kv.set(`notification_token:${fid}`, notificationToken);
    // await kv.set(`wallet_address:${fid}`, walletAddress);

    return res.status(200).json({ 
      success: true, 
      message: 'Notification subscription created successfully' 
    });

  } catch (error) {
    console.error('❌ Error in notification subscription:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
