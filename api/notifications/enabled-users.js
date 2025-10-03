// Vercel Serverless Function for getting users with notifications enabled
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📋 Getting users with notifications enabled from Redis');

    // Get all users with notifications enabled from Redis
    const { getRedisClient } = await import('../utils/redis.js');
    const redis = await getRedisClient();
    
    // Get all FIDs from the notifications_enabled_users set
    const enabledFids = await redis.sMembers('notifications_enabled_users');
    
    // Convert to numbers and filter out any invalid values
    const validFids = enabledFids
      .map(fid => parseInt(fid))
      .filter(fid => !isNaN(fid));

    console.log('✅ Retrieved users with notifications enabled:', validFids);

    return res.status(200).json({ 
      success: true,
      fids: validFids,
      count: validFids.length
    });

  } catch (error) {
    console.error('❌ Error getting users with notifications enabled:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
