import { useState, useEffect, useMemo } from "react";
import { getIpfsGatewayUrls } from "../utils/ipfs";

interface IpfsImageProps {
  src: string;
  alt: string;
  className?: string;
}

const IpfsImage = ({ src, alt, className }: IpfsImageProps) => {
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const [gatewayIndex, setGatewayIndex] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);

  const gatewayUrls = useMemo(() => getIpfsGatewayUrls(src), [src]);

  useEffect(() => {
    if (gatewayUrls.length > 0) {
      setCurrentSrc(gatewayUrls[0]);
      setGatewayIndex(0);
      setHasError(false);
    }
  }, [gatewayUrls]);

  const handleError = () => {
    console.warn("IPFS Image load failed:");
    console.warn("Failed URL:", currentSrc);
    console.warn("Gateway index:", gatewayIndex);
    
    // Try the next gateway
    const nextIndex = gatewayIndex + 1;
    if (nextIndex < gatewayUrls.length) {
      console.log("Trying next gateway:", gatewayUrls[nextIndex]);
      setCurrentSrc(gatewayUrls[nextIndex]);
      setGatewayIndex(nextIndex);
    } else {
      console.warn("All gateways failed, showing placeholder");
      setHasError(true);
    }
  };

  const handleLoad = () => {
    console.log("IPFS Image loaded successfully:", currentSrc);
    setHasError(false);
  };

  if (hasError || !currentSrc) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-700`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-sm mb-2">🖼️</div>
          <div className="text-xs">Image not available</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
};

export default IpfsImage;
