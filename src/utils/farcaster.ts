export interface FarcasterProfile {
  username: string;
  displayName?: string;
  bio?: string;
  pfpUrl?: string;
  fid: number;
}

export const lookupFarcasterProfile = async (address: string): Promise<FarcasterProfile | null> => {
  try {
    console.log("🔍 Farcaster: Looking up profile for address:", address);
    
    // Using Neynar API v2 to lookup Farcaster profiles by address
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
      {
        headers: {
          'Accept': 'application/json',
          'x-api-key': 'NEYNAR_API_DOCS', // Free tier API key for testing
        },
      }
    );

    if (!response.ok) {
      console.log("❌ Farcaster: API request failed:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log("📡 Farcaster: API response:", data);
    console.log("📡 Farcaster: API response keys:", Object.keys(data));
    console.log("📡 Farcaster: Looking for address key:", address.toLowerCase());

    // Check if we have users data and the address exists
    const addressKey = address.toLowerCase();
    if (!data[addressKey] || data[addressKey].length === 0) {
      console.log("📭 Farcaster: No users found for address:", address);
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

    console.log("✅ Farcaster: Profile found:", profile);
    return profile;
  } catch (error) {
    console.error("💥 Farcaster: Lookup error:", error);
    return null;
  }
};

export const getFarcasterProfileUrl = (username: string): string => {
  return `https://farcaster.xyz/${username}`;
}; 