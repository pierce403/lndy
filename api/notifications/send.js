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

    console.log('🔔 Sending notification via Neynar:', {
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
      // Note: Neynar doesn't have a direct notification API yet
      // For now, we'll use their cast API to post notifications
      // This is a workaround until they release their notification API
      
      if (targetFids && targetFids.length > 0) {
        // For each target FID, we'll create a cast mentioning them
        const castPromises = targetFids.map(async (fid) => {
          try {
            const castText = `🔔 ${title}\n\n${message}\n\n#LNDY #SocialLending`;
            
            const castResponse = await fetch('https://api.neynar.com/v2/farcaster/cast', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': neynarApiKey,
              },
              body: JSON.stringify({
                signer_uuid: process.env.NEYNAR_SIGNER_UUID, // You'll need to set this up
                text: castText,
                mentions: [fid], // Mention the target user
                embeds: [{
                  url: `https://lndy.org/loan/${loanId}` // Link to the loan
                }]
              })
            });

            if (!castResponse.ok) {
              console.error(`❌ Failed to send cast for FID ${fid}:`, await castResponse.text());
              return null;
            }

            const castResult = await castResponse.json();
            console.log(`✅ Cast sent successfully for FID ${fid}:`, castResult.hash);
            return castResult;
          } catch (error) {
            console.error(`❌ Error sending cast for FID ${fid}:`, error);
            return null;
          }
        });

        const castResults = await Promise.all(castPromises);
        const successfulCasts = castResults.filter(result => result !== null);
        
        console.log(`✅ Successfully sent ${successfulCasts.length}/${targetFids.length} notifications`);
        
        notificationResponse = {
          success: true,
          sentCount: successfulCasts.length,
          totalTargets: targetFids.length,
          casts: successfulCasts
        };
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
      throw error;
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
