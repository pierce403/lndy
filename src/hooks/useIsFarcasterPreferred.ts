import { useEffect, useState } from "react";

type FarcasterWindow = Window & {
  farcaster?: {
    miniApp?: unknown;
    signer?: unknown;
    user?: unknown;
  };
  FarcasterMiniApp?: unknown;
};

/**
 * Detect whether the current environment looks like it is being opened from a Farcaster client.
 * This covers Warpcast MiniApps as well as regular browsers that expose the `window.farcaster` bridge.
 */
export const useIsFarcasterPreferred = () => {
  const [isPreferred, setIsPreferred] = useState(false);

  useEffect(() => {
    const win = window as FarcasterWindow;
    const userAgent = win.navigator?.userAgent?.toLowerCase() ?? "";
    const searchParams = new URLSearchParams(win.location?.search ?? "");

    const hasBridge = Boolean(win.farcaster);
    const isMiniApp = Boolean(win.farcaster?.miniApp || win.FarcasterMiniApp);
    const fromQuery = ["source", "utm_source", "farcaster"].some((param) => {
      const value = searchParams.get(param);
      if (!value) return false;
      return value.toLowerCase().includes("farcaster") || value === "1";
    });
    const agentHints = ["warpcast", "farcaster", "dwrfc"].some((hint) =>
      userAgent.includes(hint),
    );

    setIsPreferred(hasBridge || isMiniApp || fromQuery || agentHints);
  }, []);

  return isPreferred;
};
