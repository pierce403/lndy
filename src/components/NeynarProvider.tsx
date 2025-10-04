import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

import { logNeynarDebug, logNeynarError, logNeynarInfo, logNeynarWarning } from "../utils/neynarDebug";

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
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const lastKnownContext = useRef<Record<string, unknown>>({
    windowPresent: typeof window !== "undefined",
    sdkDetected: Boolean(sdk),
  });

  useEffect(() => {
    let isCancelled = false;
    let initializationStep = "start";

    const initializeProvider = async () => {
      try {
        logNeynarDebug("Starting Neynar provider initialization", {
          windowPresent: typeof window !== "undefined",
          sdkPresent: Boolean(sdk),
        });

        initializationStep = "environment-check";
        if (typeof window === "undefined" || !sdk) {
          logNeynarWarning("Neynar SDK is unavailable in the current environment", {
            windowPresent: typeof window !== "undefined",
            sdkPresent: Boolean(sdk),
          });
          return;
        }

        let isMiniApp = false;

        try {
          initializationStep = "miniapp-detection";
          const result = sdk.isInMiniApp?.();
          if (typeof result === "boolean") {
            isMiniApp = result;
          } else if (result && typeof result.then === "function") {
            isMiniApp = await result;
          }
          logNeynarDebug("Mini app detection result", { result: isMiniApp });
        } catch (error) {
          lastKnownContext.current = {
            ...lastKnownContext.current,
            initializationStep,
            attemptedDetection: true,
          };
          logNeynarWarning("Failed to detect mini app environment", {
            error,
            initializationStep,
          });
        }

        if (!isMiniApp || isCancelled) {
          lastKnownContext.current = {
            ...lastKnownContext.current,
            initializationStep,
            isMiniApp,
            isCancelled,
          };
          logNeynarInfo("Skipping Neynar provider mount because we are not inside a mini app", {
            isMiniApp,
            isCancelled,
          });
          return;
        }

        initializationStep = "dynamic-import";
        const module = await import("@neynar/react");

        if (isCancelled) {
          lastKnownContext.current = {
            ...lastKnownContext.current,
            initializationStep,
            isCancelled,
          };
          logNeynarDebug("Initialization cancelled after dynamic import", {
            isCancelled,
          });
          return;
        }

        initializationStep = "provider-validation";
        const MiniAppProvider = module?.MiniAppProvider;

        if (typeof MiniAppProvider === "function") {
          setProviderComponent(() => MiniAppProvider as MiniAppProviderComponent);
          setShouldWrap(true);
          logNeynarInfo("Successfully initialized Neynar MiniAppProvider", {
            initializationStep,
          });
          lastKnownContext.current = {
            ...lastKnownContext.current,
            initializationStep,
            providerFound: true,
          };
        } else {
          lastKnownContext.current = {
            ...lastKnownContext.current,
            initializationStep,
            providerFound: false,
          };
          logNeynarWarning("@neynar/react did not expose a MiniAppProvider function", {
            availableKeys: Object.keys(module ?? {}),
          });
        }
      } catch (error) {
        lastKnownContext.current = {
          ...lastKnownContext.current,
          initializationStep,
          hasError: true,
        };
        const normalizedError = logNeynarError(
          "Unable to initialize Neynar Mini App provider",
          error,
          {
            ...lastKnownContext.current,
            isCancelled,
          }
        );

        if (!isCancelled) {
          setInitializationError(normalizedError);
        }
      }
    };

    void initializeProvider();

    return () => {
      isCancelled = true;
      logNeynarDebug("Cleaning up Neynar provider initialization effect", {
        initializationStep,
      });
    };
  }, []);

  if (initializationError) {
    throw initializationError;
  }

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
