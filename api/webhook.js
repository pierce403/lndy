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

    // Store user's notification preferences in Vercel KV
    const { kv } = await import('@vercel/kv');
    
    await kv.set(`notification_enabled:${fid}`, true);
    await kv.set(`notification_token:${fid}`, notificationDetails?.token || '');
    await kv.set(`notification_url:${fid}`, notificationDetails?.url || '');
    await kv.sadd('notifications_enabled_users', fid);
    
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

    // Remove user from notifications in Vercel KV
    const { kv } = await import('@vercel/kv');
    
    await kv.del(`notification_enabled:${fid}`);
    await kv.del(`notification_token:${fid}`);
    await kv.del(`notification_url:${fid}`);
    await kv.srem('notifications_enabled_users', fid);
    
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
    const { kv } = await import('@vercel/kv');
    
    await kv.set(`miniapp_user:${fid}`, true);
    await kv.sadd('miniapp_users', fid);
    
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
    const { kv } = await import('@vercel/kv');
    
    await kv.del(`miniapp_user:${fid}`);
    await kv.srem('miniapp_users', fid);
    await kv.srem('notifications_enabled_users', fid);
    
    console.log('✅ Removed MiniApp user for FID:', fid);
  } catch (error) {
    console.error('❌ Error handling MiniApp removed:', error);
  }
}
