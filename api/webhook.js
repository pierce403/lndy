// Vercel Serverless Function for handling Farcaster MiniApp webhook events
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    console.log('🔔 Farcaster Webhook Event:', JSON.stringify(event, null, 2));

    // Handle different types of Farcaster events
    switch (event.type) {
      case 'notificationsEnabled':
        await handleNotificationsEnabled(event);
        break;
      
      case 'notificationsDisabled':
        await handleNotificationsDisabled(event);
        break;
      
      case 'miniappAdded':
        await handleMiniAppAdded(event);
        break;
      
      case 'miniappRemoved':
        await handleMiniAppRemoved(event);
        break;
      
      default:
        console.log('⚠️ Unknown event type:', event.type);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Event processed successfully' 
    });

  } catch (error) {
    console.error('❌ Error processing webhook event:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

/**
 * Handle when a user enables notifications
 */
async function handleNotificationsEnabled(event) {
  try {
    const { fid, notificationDetails } = event;
    
    console.log('✅ User enabled notifications:', {
      fid,
      notificationDetails
    });

    // Store user's notification preferences in Redis
    const { getRedisClient } = await import('./utils/redis.js');
    const redis = await getRedisClient();
    
    await redis.set(`notification_enabled:${fid}`, 'true');
    await redis.set(`notification_token:${fid}`, notificationDetails?.token || '');
    await redis.set(`notification_url:${fid}`, notificationDetails?.url || '');
    await redis.sAdd('notifications_enabled_users', fid.toString());
    
    console.log('✅ Stored notification preferences for FID:', fid);
  } catch (error) {
    console.error('❌ Error handling notifications enabled:', error);
  }
}

/**
 * Handle when a user disables notifications
 */
async function handleNotificationsDisabled(event) {
  try {
    const { fid } = event;
    
    console.log('❌ User disabled notifications for FID:', fid);

    // Remove user from notifications in Redis
    const { getRedisClient } = await import('./utils/redis.js');
    const redis = await getRedisClient();
    
    await redis.del(`notification_enabled:${fid}`);
    await redis.del(`notification_token:${fid}`);
    await redis.del(`notification_url:${fid}`);
    await redis.sRem('notifications_enabled_users', fid.toString());
    
    console.log('✅ Removed notification preferences for FID:', fid);
  } catch (error) {
    console.error('❌ Error handling notifications disabled:', error);
  }
}

/**
 * Handle when a user adds the MiniApp
 */
async function handleMiniAppAdded(event) {
  try {
    const { fid } = event;
    
    console.log('➕ User added MiniApp for FID:', fid);

    // Store user as MiniApp user
    const { getRedisClient } = await import('./utils/redis.js');
    const redis = await getRedisClient();
    
    await redis.set(`miniapp_user:${fid}`, 'true');
    await redis.sAdd('miniapp_users', fid.toString());
    
    console.log('✅ Stored MiniApp user for FID:', fid);
  } catch (error) {
    console.error('❌ Error handling MiniApp added:', error);
  }
}

/**
 * Handle when a user removes the MiniApp
 */
async function handleMiniAppRemoved(event) {
  try {
    const { fid } = event;
    
    console.log('➖ User removed MiniApp for FID:', fid);

    // Remove user from MiniApp users
    const { getRedisClient } = await import('./utils/redis.js');
    const redis = await getRedisClient();
    
    await redis.del(`miniapp_user:${fid}`);
    await redis.sRem('miniapp_users', fid.toString());
    await redis.sRem('notifications_enabled_users', fid.toString());
    
    console.log('✅ Removed MiniApp user for FID:', fid);
  } catch (error) {
    console.error('❌ Error handling MiniApp removed:', error);
  }
}
