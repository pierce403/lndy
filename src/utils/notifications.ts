import { sdk } from "@farcaster/miniapp-sdk";

export interface NotificationData {
  title: string;
  message: string;
  type: 'loan_created' | 'loan_contributed' | 'loan_repaid';
  loanId?: string;
  amount?: string;
  contributorAddress?: string;
  borrowerAddress?: string;
}

/**
 * Send a notification to Farcaster users using the MiniApp SDK
 * This will show a notification in the Farcaster client
 */
export const sendFarcasterNotification = async (notification: NotificationData): Promise<void> => {
  try {
    console.log("🔔 Notifications: Sending Farcaster notification:", notification);

    // Check if we're in a Farcaster MiniApp environment
    const isMiniApp = await sdk.isInMiniApp();
    if (!isMiniApp) {
      console.log("⚠️ Notifications: Not in Farcaster environment, skipping notification");
      return;
    }

    // For now, we'll use browser notifications as a fallback since the proper notification
    // system requires server-side implementation with notification tokens
    // TODO: Implement proper server-side notification system with Neynar integration
    
    // Try to use browser notifications first
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/lndy-favicon.svg',
          badge: '/lndy-favicon.svg'
        });
        console.log("✅ Notifications: Browser notification shown");
      } else if (Notification.permission !== 'denied') {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/lndy-favicon.svg',
            badge: '/lndy-favicon.svg'
          });
          console.log("✅ Notifications: Browser notification shown after permission granted");
        } else {
          // Fallback to alert
          alert(`🔔 ${notification.title}\n\n${notification.message}`);
          console.log("✅ Notifications: Alert notification shown (permission denied)");
        }
      } else {
        // Fallback to alert
        alert(`🔔 ${notification.title}\n\n${notification.message}`);
        console.log("✅ Notifications: Alert notification shown (permission denied)");
      }
    } else {
      // Fallback to alert if notifications not supported
      alert(`🔔 ${notification.title}\n\n${notification.message}`);
      console.log("✅ Notifications: Alert notification shown (notifications not supported)");
    }
    
    // Log the notification for debugging
    console.log("📝 Notifications: Notification details:", {
      title: notification.title,
      message: notification.message,
      type: notification.type,
      loanId: notification.loanId,
      amount: notification.amount,
      contributorAddress: notification.contributorAddress,
      borrowerAddress: notification.borrowerAddress
    });
    
  } catch (error) {
    console.error("❌ Notifications: Failed to send Farcaster notification:", error);
    // Don't throw - notifications are not critical to the core functionality
  }
};

/**
 * Send notification for new loan creation
 * This should be called when a new loan is created
 */
export const notifyLoanCreated = async (loanData: {
  loanId: string;
  borrowerAddress: string;
  loanAmount: string;
  title: string;
  description: string;
}): Promise<void> => {
  const notification: NotificationData = {
    title: "🎉 New Loan Created!",
    message: `"${loanData.title}" - ${loanData.loanAmount} USDC loan is now available for funding`,
    type: 'loan_created',
    loanId: loanData.loanId,
    borrowerAddress: loanData.borrowerAddress,
  };

  await sendFarcasterNotification(notification);
};

/**
 * Send notification for loan contribution
 * This should be called when someone contributes to a loan
 */
export const notifyLoanContributed = async (contributionData: {
  loanId: string;
  borrowerAddress: string;
  contributorAddress: string;
  amount: string;
  loanTitle: string;
}): Promise<void> => {
  const notification: NotificationData = {
    title: "💰 New Contribution!",
    message: `Someone contributed ${contributionData.amount} USDC to your loan "${contributionData.loanTitle}"`,
    type: 'loan_contributed',
    loanId: contributionData.loanId,
    amount: contributionData.amount,
    contributorAddress: contributionData.contributorAddress,
    borrowerAddress: contributionData.borrowerAddress,
  };

  await sendFarcasterNotification(notification);
};

/**
 * Send notification for loan repayment
 * This should be called when a loan is repaid (even partially)
 */
export const notifyLoanRepaid = async (repaymentData: {
  loanId: string;
  borrowerAddress: string;
  amount: string;
  loanTitle: string;
  isPartial: boolean;
}): Promise<void> => {
  const notification: NotificationData = {
    title: repaymentData.isPartial ? "💸 Partial Repayment!" : "🎉 Loan Repaid!",
    message: `"${repaymentData.loanTitle}" received a ${repaymentData.isPartial ? 'partial' : 'full'} repayment of ${repaymentData.amount} USDC`,
    type: 'loan_repaid',
    loanId: repaymentData.loanId,
    amount: repaymentData.amount,
    borrowerAddress: repaymentData.borrowerAddress,
  };

  await sendFarcasterNotification(notification);
};

/**
 * Send notification to all users about a new loan
 * This is a broadcast notification for all Farcaster users
 */
export const broadcastNewLoan = async (loanData: {
  loanId: string;
  borrowerAddress: string;
  loanAmount: string;
  title: string;
  description: string;
}): Promise<void> => {
  const notification: NotificationData = {
    title: "🌟 New Loan Available!",
    message: `"${loanData.title}" - ${loanData.loanAmount} USDC loan is now available for funding`,
    type: 'loan_created',
    loanId: loanData.loanId,
    borrowerAddress: loanData.borrowerAddress,
  };

  await sendFarcasterNotification(notification);
};

/**
 * Send notification to contributors about repayment
 * This should be called for each contributor when a loan is repaid
 */
export const notifyContributorsRepayment = async (repaymentData: {
  loanId: string;
  borrowerAddress: string;
  amount: string;
  loanTitle: string;
  isPartial: boolean;
  contributorAddress: string;
}): Promise<void> => {
  const notification: NotificationData = {
    title: repaymentData.isPartial ? "💸 Partial Repayment!" : "🎉 Loan Repaid!",
    message: `A loan you contributed to "${repaymentData.loanTitle}" received a ${repaymentData.isPartial ? 'partial' : 'full'} repayment of ${repaymentData.amount} USDC`,
    type: 'loan_repaid',
    loanId: repaymentData.loanId,
    amount: repaymentData.amount,
    borrowerAddress: repaymentData.borrowerAddress,
  };

  await sendFarcasterNotification(notification);
};
