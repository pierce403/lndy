import { lookupFarcasterProfile } from "./farcaster";
import { logNeynarDebug, logNeynarError, logNeynarInfo } from "./neynarDebug";

/**
 * Resolve Farcaster ID (FID) from wallet address
 * Uses Neynar API to lookup Farcaster profiles by address
 */
export const resolveFidFromAddress = async (address: string): Promise<number | null> => {
  try {
    logNeynarDebug("Resolving FID for address", { address });

    const profile = await lookupFarcasterProfile(address);
    if (profile && profile.fid) {
      logNeynarInfo("Resolved FID for address", { address, fid: profile.fid, username: profile.username });
      return profile.fid;
    }

    logNeynarInfo("No FID found for address", { address });
    return null;
  } catch (error) {
    logNeynarError("Error resolving FID from address", error, { address });
    return null;
  }
};

/**
 * Resolve multiple FIDs from wallet addresses
 */
export const resolveFidsFromAddresses = async (addresses: string[]): Promise<number[]> => {
  logNeynarDebug("Resolving FIDs for multiple addresses", { addresses });

  const fidPromises = addresses.map(address => resolveFidFromAddress(address));
  const fids = await Promise.all(fidPromises);

  // Filter out null values and return only valid FIDs
  const validFids = fids.filter((fid): fid is number => fid !== null);

  logNeynarInfo("Resolved valid FIDs", { fids: validFids });
  return validFids;
};

/**
 * Get all users with notifications enabled from Vercel KV
 */
export const getAllSubscribedUserFids = async (): Promise<number[]> => {
  try {
    logNeynarDebug("Fetching subscribed user FIDs from API endpoint");

    // Call our API endpoint to get users with notifications enabled
    const response = await fetch('/api/notifications/enabled-users');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    logNeynarInfo("Fetched subscribed FIDs", { fids: data.fids });
    return data.fids || [];
  } catch (error) {
    logNeynarError("Failed to fetch subscribed user FIDs", error);
    return [];
  }
};
