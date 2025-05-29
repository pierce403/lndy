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
    
    // Using Neynar API (free tier) to lookup Farcaster profiles by address
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
      {
        headers: {
          'Accept': 'application/json',
          'api_key': 'NEYNAR_API_DOCS', // Free tier API key for testing
        },
      }
    );

    if (!response.ok) {
      console.log("❌ Farcaster: API request failed:", response.status);
      return null;
    }

    const data = await response.json();
    console.log("📡 Farcaster: API response:", data);

    // Check if we have users data and the address exists
    if (!data.users || !data.users[address.toLowerCase()]) {
      console.log("📭 Farcaster: No profile found for address:", address);
      return null;
    }

    const userArray = data.users[address.toLowerCase()];
    if (!userArray || userArray.length === 0) {
      console.log("📭 Farcaster: Empty user array for address:", address);
      return null;
    }

    // Take the first user (primary account)
    const user = userArray[0];
    
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
  return `https://warpcast.com/${username}`;
}; 