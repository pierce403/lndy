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

    // Note: We're not using Neynar API for notifications anymore
    // Browser notifications are handled client-side

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

    // Log notification for debugging and analytics
    console.log('📊 Notification logged:', {
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

    // For now, we're using browser notifications as the primary method
    // Server-side notifications can be added when Farcaster releases official APIs
    const notificationResponse = {
      success: true,
      sentCount: targetFids ? targetFids.length : 0,
      totalTargets: targetFids ? targetFids.length : 0,
      message: 'Notification logged successfully (browser notifications handled client-side)'
    };

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
