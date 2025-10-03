// Vercel Serverless Function for sending notifications via Neynar
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      type, 
      title, 
      message, 
      loanId, 
      amount, 
      contributorAddress, 
      borrowerAddress,
      targetFids = [] // Array of FIDs to notify
    } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, title, message' 
      });
    }

    const neynarApiKey = process.env.NEYNAR_API_KEY;
    if (!neynarApiKey) {
      console.error('❌ NEYNAR_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'Neynar API key not configured' 
      });
    }

    console.log('🔔 Sending Farcaster notification via Neynar:', {
      type,
      title,
      message,
      loanId,
      amount,
      contributorAddress,
      borrowerAddress,
      targetFids,
      timestamp: new Date().toISOString()
    });

    // Send notification via Neynar API
    let notificationResponse;
    try {
      if (targetFids && targetFids.length > 0) {
        // Filter to only users who have enabled notifications
        const { getRedisClient } = await import('../utils/redis.js');
        const redis = await getRedisClient();
        const enabledUsers = await redis.sMembers('notifications_enabled_users');
        const enabledFids = enabledUsers.map(fid => parseInt(fid)).filter(fid => !isNaN(fid));
        
        const validTargetFids = targetFids.filter(fid => enabledFids.includes(fid));
        
        if (validTargetFids.length === 0) {
          console.log('⚠️ No users with enabled notifications found');
          notificationResponse = {
            success: true,
            sentCount: 0,
            totalTargets: targetFids.length,
            message: 'No users with enabled notifications'
          };
        } else {
          // Send notification via Neynar API
          const notificationData = {
            targetFids: validTargetFids,
            notification: {
              title: title,
              body: message,
              target_url: `https://lndy.org/loan/${loanId}`,
              metadata: {
                loanId,
                amount,
                contributorAddress,
                borrowerAddress,
                type
              }
            }
          };

          const neynarResponse = await fetch('https://api.neynar.com/v2/farcaster/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': neynarApiKey,
            },
            body: JSON.stringify(notificationData)
          });

          if (!neynarResponse.ok) {
            const errorText = await neynarResponse.text();
            console.error('❌ Neynar API error:', errorText);
            throw new Error(`Neynar API error: ${neynarResponse.status} ${errorText}`);
          }

          const neynarResult = await neynarResponse.json();
          console.log('✅ Neynar notification sent successfully:', neynarResult);
          
          notificationResponse = {
            success: true,
            sentCount: validTargetFids.length,
            totalTargets: targetFids.length,
            enabledUsers: validTargetFids.length,
            neynarResult
          };
        }
      } else {
        console.log('⚠️ No target FIDs provided, skipping notification');
        notificationResponse = {
          success: true,
          sentCount: 0,
          totalTargets: 0,
          message: 'No target FIDs provided'
        };
      }
    } catch (error) {
      console.error('❌ Error sending notification via Neynar:', error);
      // Don't throw - log the error but don't break the flow
      notificationResponse = {
        success: false,
        error: error.message,
        sentCount: 0,
        totalTargets: targetFids ? targetFids.length : 0
      };
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Notification sent successfully',
      notificationId: `notif_${Date.now()}`,
      ...notificationResponse
    });

  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
