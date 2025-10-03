// Vercel Serverless Function for getting all subscribed users
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📋 Getting all subscribed users from Redis');

    // Get all subscribed users from Redis
    const { getRedisClient } = await import('../utils/redis.js');
    const redis = await getRedisClient();
    
    // Get all FIDs from the subscribed_users set
    const subscribedFids = await redis.sMembers('subscribed_users');
    
    // Convert to numbers and filter out any invalid values
    const validFids = subscribedFids
      .map(fid => parseInt(fid))
      .filter(fid => !isNaN(fid));

    console.log('✅ Retrieved subscribed FIDs:', validFids);

    return res.status(200).json({ 
      success: true,
      fids: validFids,
      count: validFids.length
    });

  } catch (error) {
    console.error('❌ Error getting subscribed users:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
