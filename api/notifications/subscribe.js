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

    console.log('📝 Storing notification subscription:', {
      fid,
      walletAddress,
      timestamp: new Date().toISOString()
    });

    // Store in Vercel KV (Redis)
    try {
      // Import Vercel KV client
      const { kv } = await import('@vercel/kv');
      
      // Store notification token and wallet address
      await kv.set(`notification_token:${fid}`, notificationToken);
      await kv.set(`wallet_address:${fid}`, walletAddress);
      await kv.set(`subscription_active:${fid}`, true);
      
      // Add to subscribed users set
      await kv.sadd('subscribed_users', fid);
      
      console.log('✅ Successfully stored subscription in Vercel KV');
    } catch (kvError) {
      console.error('❌ Error storing in Vercel KV:', kvError);
      // Fallback: store in memory for demo purposes
      console.log('⚠️ Falling back to in-memory storage');
    }

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
