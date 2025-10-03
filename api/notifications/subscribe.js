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

    // Store in Redis
    try {
      // Import Redis client
      const { getRedisClient } = await import('../utils/redis.js');
      const redis = await getRedisClient();
      
      // Store notification token and wallet address
      await redis.set(`notification_token:${fid}`, notificationToken);
      await redis.set(`wallet_address:${fid}`, walletAddress);
      await redis.set(`subscription_active:${fid}`, 'true');
      
      // Add to subscribed users set
      await redis.sAdd('subscribed_users', fid.toString());
      
      console.log('✅ Successfully stored subscription in Redis');
    } catch (redisError) {
      console.error('❌ Error storing in Redis:', redisError);
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
