# Farcaster MiniApp Notifications

## 🎯 **How It Works**

This system sends **real Farcaster notifications** that appear in users' Farcaster clients when loan events occur.

### **The Flow**
1. **User enables notifications** → Farcaster sends webhook to our server
2. **We store their FID** → User is added to notifications list
3. **Loan event occurs** → We send notification via Neynar API
4. **User sees notification** → Appears in their Farcaster client

## 🔧 **Setup Required**

### **1. Get Neynar API Key**
1. Go to [neynar.com](https://neynar.com)
2. Create account and get API key
3. Add to Vercel environment variables as `NEYNAR_API_KEY`

### **2. Set up Vercel KV**
1. Add Vercel KV to your project
2. Environment variables are auto-configured

### **3. Deploy to Vercel**
```bash
vercel --prod
```

## 📱 **User Experience**

### **In Farcaster Client**
- Users see notifications in their Farcaster notifications feed
- Notifications include loan details and links
- Clicking notification opens the loan page

### **Notification Types**
- **New Loan**: "🎉 New Loan Created! 'Emergency Fund' - $500 USDC loan is now available"
- **Loan Funded**: "💰 New Contribution! Someone contributed $50 to your loan 'Emergency Fund'"
- **Loan Repaid**: "💸 Partial Repayment! 'Emergency Fund' received a partial repayment of $100"

## 🔔 **How Users Enable Notifications**

1. **Open LNDY in Farcaster**
2. **Farcaster will prompt** to enable notifications
3. **User accepts** → Webhook sent to our server
4. **User is added** to notifications list
5. **Notifications start working** immediately

## 🏗️ **Technical Implementation**

### **Webhook Endpoint** (`/api/webhook`)
- Handles Farcaster events
- Stores user notification preferences
- Manages user subscription status

### **Notification API** (`/api/notifications/send`)
- Sends notifications via Neynar API
- Filters to only users with notifications enabled
- Includes rich metadata and links

### **FID Resolution**
- Converts wallet addresses to Farcaster IDs
- Gets list of users with notifications enabled
- Handles batch operations efficiently

## 🎯 **Benefits**

- ✅ **Real Farcaster notifications** in user's client
- ✅ **No browser permission needed** - works automatically
- ✅ **Rich notifications** with loan details and links
- ✅ **User-controlled** - users can enable/disable
- ✅ **Scalable** - handles any number of users
- ✅ **Reliable** - uses official Farcaster/Neynar APIs

## 🚀 **Deployment Checklist**

- [ ] Get Neynar API key
- [ ] Add Vercel KV to project
- [ ] Set environment variables
- [ ] Deploy to Vercel
- [ ] Test webhook endpoint
- [ ] Test notification sending

## 🔍 **Testing**

1. **Enable notifications** in Farcaster client
2. **Create a loan** → Check Farcaster notifications
3. **Fund a loan** → Check Farcaster notifications
4. **Make repayment** → Check Farcaster notifications

This system provides **real Farcaster notifications** that users will see in their Farcaster client! 🎉
