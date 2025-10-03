import { sdk } from "@farcaster/miniapp-sdk";

export interface ServerNotificationData {
  type: 'loan_created' | 'loan_contributed' | 'loan_repaid';
  title: string;
  message: string;
  loanId?: string;
  amount?: string;
  contributorAddress?: string;
  borrowerAddress?: string;
  targetFids?: number[];
}

/**
 * Subscribe to notifications by storing the user's notification token
 */
export const subscribeToNotifications = async (walletAddress: string): Promise<boolean> => {
  try {
    console.log("🔔 ServerNotifications: Subscribing to notifications for:", walletAddress);

    // Check if we're in a Farcaster MiniApp environment
    const isMiniApp = await sdk.isInMiniApp();
    if (!isMiniApp) {
      console.log("⚠️ ServerNotifications: Not in Farcaster environment, skipping subscription");
      return false;
    }

    // Get user context to get FID
    const context = await sdk.context;
    const user = context?.user;
    if (!user || !user.fid) {
      console.error("❌ ServerNotifications: No user context or FID available");
      return false;
    }

    // For now, we'll simulate getting a notification token
    // In a real implementation, you'd get this from the Farcaster SDK
    const notificationToken = `token_${user.fid}_${Date.now()}`;

    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fid: user.fid,
        notificationToken,
        walletAddress,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ ServerNotifications: Subscription successful:", result);
    return true;

  } catch (error) {
    console.error("❌ ServerNotifications: Failed to subscribe to notifications:", error);
    return false;
  }
};

/**
 * Send a notification via the server-side API
 */
export const sendServerNotification = async (notification: ServerNotificationData): Promise<boolean> => {
  try {
    console.log("🔔 ServerNotifications: Sending server notification:", notification);

    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ ServerNotifications: Notification sent successfully:", result);
    return true;

  } catch (error) {
    console.error("❌ ServerNotifications: Failed to send notification:", error);
    return false;
  }
};

/**
 * Send notification for new loan creation
 */
export const notifyServerLoanCreated = async (loanData: {
  loanId: string;
  borrowerAddress: string;
  loanAmount: string;
  title: string;
  description: string;
  targetFids?: number[];
}): Promise<boolean> => {
  const notification: ServerNotificationData = {
    type: 'loan_created',
    title: "🎉 New Loan Created!",
    message: `"${loanData.title}" - ${loanData.loanAmount} USDC loan is now available for funding`,
    loanId: loanData.loanId,
    borrowerAddress: loanData.borrowerAddress,
    targetFids: loanData.targetFids,
  };

  return await sendServerNotification(notification);
};

/**
 * Send notification for loan contribution
 */
export const notifyServerLoanContributed = async (contributionData: {
  loanId: string;
  borrowerAddress: string;
  contributorAddress: string;
  amount: string;
  loanTitle: string;
  targetFids?: number[];
}): Promise<boolean> => {
  const notification: ServerNotificationData = {
    type: 'loan_contributed',
    title: "💰 New Contribution!",
    message: `Someone contributed ${contributionData.amount} to your loan "${contributionData.loanTitle}"`,
    loanId: contributionData.loanId,
    amount: contributionData.amount,
    contributorAddress: contributionData.contributorAddress,
    borrowerAddress: contributionData.borrowerAddress,
    targetFids: contributionData.targetFids,
  };

  return await sendServerNotification(notification);
};

/**
 * Send notification for loan repayment
 */
export const notifyServerLoanRepaid = async (repaymentData: {
  loanId: string;
  borrowerAddress: string;
  amount: string;
  loanTitle: string;
  isPartial: boolean;
  targetFids?: number[];
}): Promise<boolean> => {
  const notification: ServerNotificationData = {
    type: 'loan_repaid',
    title: repaymentData.isPartial ? "💸 Partial Repayment!" : "🎉 Loan Repaid!",
    message: `"${repaymentData.loanTitle}" received a ${repaymentData.isPartial ? 'partial' : 'full'} repayment of ${repaymentData.amount}`,
    loanId: repaymentData.loanId,
    amount: repaymentData.amount,
    borrowerAddress: repaymentData.borrowerAddress,
    targetFids: repaymentData.targetFids,
  };

  return await sendServerNotification(notification);
};
