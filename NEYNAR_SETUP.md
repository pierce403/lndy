# Neynar Integration Setup Guide

This guide will help you set up Neynar integration for Farcaster MiniApp notifications.

## 1. Get Neynar API Key

1. Go to [Neynar Developer Portal](https://neynar.com)
2. Sign up or log in to your account
3. Create a new project or select an existing one
4. Navigate to the API Keys section
5. Generate a new API key for your project
6. Copy the API key for use in your environment variables

## 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# Neynar API Key for Farcaster notifications
NEYNAR_API_KEY=your_neynar_api_key_here
```

## 3. Vercel Configuration

### Option A: Using Vercel Dashboard
1. Go to your project in Vercel Dashboard
2. Navigate to Settings > Environment Variables
3. Add `NEYNAR_API_KEY` with your API key value
4. Deploy your project

### Option B: Using Vercel CLI
```bash
vercel env add NEYNAR_API_KEY
# Enter your API key when prompted
```

## 4. Update MiniApp Manifest

Add the following to your `public/farcaster.json`:

```json
{
  "version": "1.0.0",
  "name": "LNDY - Social Lending",
  "description": "Decentralized social lending platform",
  "icon": "https://lndy.org/lndy-favicon.svg",
  "webhookUrl": "https://your-vercel-app.vercel.app/api/notifications/webhook",
  "notifications": {
    "enabled": true,
    "types": ["loan_created", "loan_contributed", "loan_repaid"]
  }
}
```

## 5. Test the Integration

1. Deploy your app to Vercel
2. Open the app in a Farcaster client
3. Create a loan or make a contribution
4. Check the Vercel function logs for notification activity
5. Verify notifications appear in your Farcaster client

## 6. Production Considerations

### Rate Limits
- Neynar has rate limits for notifications
- Implement proper error handling and retry logic
- Consider using a queue system for high-volume notifications

### Security
- Never expose your API key in client-side code
- Use Vercel environment variables for secure storage
- Implement proper authentication for API endpoints

### Monitoring
- Set up logging for notification success/failure rates
- Monitor API usage and costs
- Implement alerting for notification failures

## 7. Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the key is correctly set in environment variables
   - Check that the key has the correct permissions
   - Ensure the key is not expired

2. **Notifications Not Sending**
   - Check Vercel function logs for errors
   - Verify the webhook URL is correctly configured
   - Ensure the MiniApp manifest is properly formatted

3. **Rate Limiting**
   - Implement exponential backoff for retries
   - Consider batching notifications
   - Monitor your API usage

### Debug Mode

Enable debug logging by adding this to your environment variables:

```bash
DEBUG_NOTIFICATIONS=true
```

This will provide detailed logs about notification processing.

## 8. Next Steps

1. **User Subscription Management**: Implement a system to track which users have subscribed to notifications
2. **Notification Preferences**: Allow users to customize which types of notifications they receive
3. **Analytics**: Track notification open rates and user engagement
4. **Advanced Features**: Implement push notifications, email notifications, or SMS notifications as alternatives

## Support

- [Neynar Documentation](https://docs.neynar.com)
- [Farcaster MiniApp Documentation](https://miniapps.farcaster.xyz)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
