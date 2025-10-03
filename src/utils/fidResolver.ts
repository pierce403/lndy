import { lookupFarcasterProfile } from './farcaster';

/**
 * Resolve Farcaster ID (FID) from wallet address
 * Uses Neynar API to lookup Farcaster profiles by address
 */
export const resolveFidFromAddress = async (address: string): Promise<number | null> => {
  try {
    console.log("🔍 FidResolver: Looking up FID for address:", address);
    
    const profile = await lookupFarcasterProfile(address);
    if (profile && profile.fid) {
      console.log("✅ FidResolver: Found FID:", profile.fid, "for address:", address);
      return profile.fid;
    }
    
    console.log("❌ FidResolver: No FID found for address:", address);
    return null;
  } catch (error) {
    console.error("❌ FidResolver: Error resolving FID:", error);
    return null;
  }
};

/**
 * Resolve multiple FIDs from wallet addresses
 */
export const resolveFidsFromAddresses = async (addresses: string[]): Promise<number[]> => {
  console.log("🔍 FidResolver: Resolving FIDs for addresses:", addresses);
  
  const fidPromises = addresses.map(address => resolveFidFromAddress(address));
  const fids = await Promise.all(fidPromises);
  
  // Filter out null values and return only valid FIDs
  const validFids = fids.filter((fid): fid is number => fid !== null);
  
  console.log("✅ FidResolver: Resolved FIDs:", validFids);
  return validFids;
};

/**
 * Get all users with notifications enabled from Vercel KV
 */
export const getAllSubscribedUserFids = async (): Promise<number[]> => {
  try {
    console.log("📋 FidResolver: Getting all users with notifications enabled");
    
    // Call our API endpoint to get users with notifications enabled
    const response = await fetch('/api/notifications/enabled-users');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("✅ FidResolver: Retrieved users with notifications enabled:", data.fids);
    return data.fids || [];
  } catch (error) {
    console.error("❌ FidResolver: Error getting users with notifications enabled:", error);
    return [];
  }
};
