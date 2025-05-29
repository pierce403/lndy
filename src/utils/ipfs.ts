/**
 * Convert IPFS URI to a publicly accessible gateway URL
 * @param ipfsUri - The IPFS URI (e.g., "ipfs://QmHash" or "https://...")
 * @returns A publicly accessible URL
 */
export function convertIpfsToGatewayUrl(ipfsUri: string): string {
  if (!ipfsUri) return '';
  
  // If it's already a full HTTP URL, return as-is
  if (ipfsUri.startsWith('http://') || ipfsUri.startsWith('https://')) {
    return ipfsUri;
  }
  
  // If it's an IPFS URI, convert to gateway URL
  if (ipfsUri.startsWith('ipfs://')) {
    const hash = ipfsUri.replace('ipfs://', '');
    // Use a reliable public IPFS gateway
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }
  
  // If it starts with just the hash, assume it's IPFS
  if (ipfsUri.match(/^Qm[1-9A-Za-z]{44}$/)) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsUri}`;
  }
  
  // For Thirdweb URIs that might be in a different format
  if (ipfsUri.includes('ipfs.io') || ipfsUri.includes('thirdweb')) {
    return ipfsUri;
  }
  
  // Fallback: assume it's a hash and try the gateway
  return `https://gateway.pinata.cloud/ipfs/${ipfsUri}`;
}

/**
 * Get multiple gateway URLs for an IPFS hash for fallback purposes
 * @param ipfsUri - The IPFS URI
 * @returns Array of gateway URLs to try
 */
export function getIpfsGatewayUrls(ipfsUri: string): string[] {
  if (!ipfsUri) return [];
  
  const hash = ipfsUri.replace('ipfs://', '').replace('https://gateway.pinata.cloud/ipfs/', '');
  
  return [
    `https://gateway.pinata.cloud/ipfs/${hash}`,
    `https://cloudflare-ipfs.com/ipfs/${hash}`,
    `https://ipfs.io/ipfs/${hash}`,
    `https://${hash}.ipfs.dweb.link`,
  ];
} 