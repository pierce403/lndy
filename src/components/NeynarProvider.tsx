import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

interface NeynarProviderProps {
  children: ReactNode;
}

type MiniAppProviderComponent = ComponentType<{
  children: ReactNode;
  analyticsEnabled?: boolean;
  backButtonEnabled?: boolean;
  returnUrl?: string;
}>;

/**
 * Wrapper component for Neynar SDK that only mounts the Neynar provider
 * when running inside a Farcaster Mini App. This guards against the
 * Neynar SDK throwing during initialization in regular web environments.
 */
const NeynarProvider = ({ children }: NeynarProviderProps) => {
  const [ProviderComponent, setProviderComponent] = useState<MiniAppProviderComponent | null>(null);
  const [shouldWrap, setShouldWrap] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const initializeProvider = async () => {
      try {
        if (typeof window === "undefined" || !sdk) {
          return;
        }

        let isMiniApp = false;

        try {
          const result = sdk.isInMiniApp?.();
          if (typeof result === "boolean") {
            isMiniApp = result;
          } else if (result && typeof result.then === "function") {
            isMiniApp = await result;
          }
        } catch (error) {
          console.warn("NeynarProvider: failed to detect mini app environment", error);
        }

        if (!isMiniApp || isCancelled) {
          return;
        }

        const module = await import("@neynar/react");

        if (isCancelled) {
          return;
        }

        const MiniAppProvider = module?.MiniAppProvider;

        if (typeof MiniAppProvider === "function") {
          setProviderComponent(() => MiniAppProvider as MiniAppProviderComponent);
          setShouldWrap(true);
        }
      } catch (error) {
        console.error("NeynarProvider: unable to initialize Neynar Mini App provider", error);
      }
    };

    void initializeProvider();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (!shouldWrap || !ProviderComponent) {
    return <>{children}</>;
  }

  return (
    <ProviderComponent analyticsEnabled backButtonEnabled>
      {children}
    </ProviderComponent>
  );
};

export default NeynarProvider;
