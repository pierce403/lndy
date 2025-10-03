# Complete Neynar Setup Guide for Farcaster Notifications

## 🎯 **What You Need to Set Up**

### **1. Neynar Developer Account** ✅
1. Go to [neynar.com](https://neynar.com)
2. Sign up for a free developer account
3. Create a new app/project

### **2. Get Your Neynar API Key** ✅
1. In your Neynar dashboard, go to your app settings
2. Find your **API Key** (looks like: `sk_...`)
3. Copy this key - you'll need it for Vercel environment variables

### **3. Get Your Neynar Webhook URL** ⚠️ **IMPORTANT**
1. In your Neynar dashboard, find your **Frame Events Webhook URL**
2. It should look like: `https://api.neynar.com/f/app/YOUR_CLIENT_ID/event`
3. **Replace the placeholder in `public/farcaster.json`**:
   ```json
   {
     "miniApp": {
       "webhookUrl": "https://api.neynar.com/f/app/YOUR_ACTUAL_CLIENT_ID/event"
     }
   }
   ```

### **4. Set Up Vercel Environment Variables** ✅
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add: `NEYNAR_API_KEY` = `your_actual_api_key_here`
4. Deploy your project

### **5. Set Up Vercel KV** ✅
1. In Vercel dashboard, go to Storage tab
2. Add Vercel KV database
3. Environment variables are auto-configured

## 🚀 **Deployment Steps**

1. **Update `farcaster.json`** with your actual Neynar webhook URL
2. **Set environment variables** in Vercel dashboard
3. **Deploy to Vercel**: `vercel --prod`
4. **Test the webhook** by visiting your deployed URL

## 🧪 **Testing the Setup**

### **Step 1: Test Webhook**
Visit: `https://your-app.vercel.app/api/webhook`
- Should return: `{"error":"Method not allowed"}` (this is correct for GET requests)

### **Step 2: Test Notifications**
1. Open your app in Farcaster client
2. Click "Add MiniApp & Enable Notifications"
3. Create a loan or fund a loan
4. Check your Farcaster notifications feed

### **Step 3: Check Logs**
1. Go to Vercel dashboard > Functions tab
2. Check logs for webhook events and notification sending
3. Look for success/error messages

## 🔍 **Troubleshooting**

### **Webhook Not Working**
- ✅ Check that `farcaster.json` has correct Neynar webhook URL
- ✅ Verify the URL is accessible (should return 405 for GET requests)
- ✅ Check Vercel function logs for errors

### **Notifications Not Sending**
- ✅ Verify `NEYNAR_API_KEY` is set correctly
- ✅ Check that users have enabled notifications
- ✅ Look at Vercel function logs for Neynar API errors

### **Users Not Getting Notifications**
- ✅ Make sure users clicked "Add MiniApp & Enable Notifications"
- ✅ Check that webhook events are being received
- ✅ Verify users are in the `notifications_enabled_users` set in Vercel KV

## 📊 **What Happens When It Works**

1. **User enables notifications** → Webhook receives event → User added to notifications list
2. **Loan event occurs** → System sends notification via Neynar API
3. **User sees notification** → Appears in their Farcaster notifications feed
4. **User clicks notification** → Opens the specific loan page

## 🎯 **Expected User Experience**

- **In Farcaster client**: Real notifications appear in notifications feed
- **Notification content**: "💰 New Contribution! Someone contributed $50 to your loan 'Emergency Fund'"
- **Clickable**: Notifications link directly to the loan page
- **Rich metadata**: Includes loan details, amounts, and links

## ✅ **Success Indicators**

- ✅ Webhook endpoint responds correctly
- ✅ Users can enable notifications via the UI
- ✅ Loan events trigger notifications
- ✅ Notifications appear in Farcaster client
- ✅ Vercel logs show successful API calls

This setup will give you **real Farcaster notifications** that users see in their Farcaster client! 🎉
