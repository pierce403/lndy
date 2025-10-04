import { logNeynarDebug, logNeynarError, logNeynarInfo, logNeynarWarning } from "./neynarDebug";

export interface FarcasterProfile {
  username: string;
  displayName?: string;
  bio?: string;
  pfpUrl?: string;
  fid: number;
}

export const lookupFarcasterProfile = async (address: string): Promise<FarcasterProfile | null> => {
  try {
    logNeynarDebug("Looking up Farcaster profile via Neynar API", { address });

    const endpoint = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`;

    // Using Neynar API v2 to lookup Farcaster profiles by address
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        "x-api-key": "NEYNAR_API_DOCS", // Free tier API key for testing
      },
    });

    if (!response.ok) {
      const errorContext = {
        status: response.status,
        statusText: response.statusText,
        endpoint,
      };
      logNeynarWarning("Neynar API request failed", errorContext);
      throw new Error(`Neynar API request failed with status ${response.status}`);
    }

    const data = await response.json();
    logNeynarDebug("Received response from Neynar API", {
      keys: Object.keys(data),
    });

    // Check if we have users data and the address exists
    const addressKey = address.toLowerCase();
    if (!data[addressKey] || data[addressKey].length === 0) {
      logNeynarInfo("No Neynar users returned for address", { address, addressKey });
      return null;
    }

    // Take the first user (primary account)
    const user = data[addressKey][0];

    const profile: FarcasterProfile = {
      username: user.username,
      displayName: user.display_name,
      bio: user.profile?.bio?.text,
      pfpUrl: user.pfp_url,
      fid: user.fid,
    };

    logNeynarInfo("Successfully resolved Farcaster profile", { fid: profile.fid, username: profile.username });
    return profile;
  } catch (error) {
    logNeynarError("Farcaster profile lookup failed", error, { address });
    return null;
  }
};

export const getFarcasterProfileUrl = (username: string): string => {
  return `https://farcaster.xyz/${username}`;
}; 