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

    // For now, we'll simulate sending notifications
    // In production, you'd use Neynar's notification API
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

    // TODO: Implement actual Neynar notification sending
    // const notificationResponse = await fetch('https://api.neynar.com/v2/farcaster/notifications', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'x-api-key': neynarApiKey,
    //   },
    //   body: JSON.stringify({
    //     target_fids: targetFids,
    //     title,
    //     message,
    //     type: 'miniapp_notification',
    //     metadata: {
    //       loanId,
    //       amount,
    //       contributorAddress,
    //       borrowerAddress
    //     }
    //   })
    // });

    // For demo purposes, return success
    return res.status(200).json({ 
      success: true, 
      message: 'Notification sent successfully',
      notificationId: `notif_${Date.now()}`,
      targetFids
    });

  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
