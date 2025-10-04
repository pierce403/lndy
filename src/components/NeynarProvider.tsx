import {
  Component,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import type { ErrorInfo } from "react";
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

type NeynarStatus = "initializing" | "skipped" | "ready" | "error";
type WrapMode = "pending" | "enabled" | "disabled";

interface NeynarRenderBoundaryProps {
  children: ReactNode;
  onError: (error: Error, info: ErrorInfo) => void;
}

interface NeynarRenderBoundaryState {
  hasError: boolean;
}

class NeynarRenderBoundary extends Component<
  NeynarRenderBoundaryProps,
  NeynarRenderBoundaryState
> {
  state: NeynarRenderBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): NeynarRenderBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

interface NeynarStatusBannerProps {
  error?: Error | null;
}

const NeynarStatusBanner = ({ error }: NeynarStatusBannerProps) => {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-md mb-4">
      <div className="font-semibold">⚠️ Neynar Mini App integration temporarily disabled</div>
      <p className="mt-1 text-sm leading-relaxed">
        Neynar's <code>MiniAppProvider</code> is currently failing to load, so Farcaster in-app notifications are unavailable. Review the latest Neynar React Mini App documentation and ensure the SDK version and initialization logic match{' '}
        <a
          className="underline"
          href="https://docs.neynar.com/reference/mini-app-sdk"
          target="_blank"
          rel="noreferrer"
        >
          Neynar's Mini App SDK guide
        </a>
        . After updating the Neynar SDK or adjusting the initialization flow, reload the page to restore Mini App features.
      </p>
      {error?.message && (
        <p className="mt-2 text-xs text-amber-800 dark:text-amber-300 break-words">
          Error details: {error.message}
        </p>
      )}
    </div>
  );
};

/**
 * Wrapper component for Neynar SDK that only mounts the Neynar provider
 * when running inside a Farcaster Mini App. This guards against the
 * Neynar SDK throwing during initialization in regular web environments.
 */
const NeynarProvider = ({ children }: NeynarProviderProps) => {
  const [ProviderComponent, setProviderComponent] =
    useState<MiniAppProviderComponent | null>(null);
  const [wrapMode, setWrapMode] = useState<WrapMode>("pending");
  const [status, setStatus] = useState<NeynarStatus>("initializing");
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const [providerError, setProviderError] = useState<Error | null>(null);
  const [boundaryKey, setBoundaryKey] = useState(0);
  const lastKnownContext = useRef<Record<string, unknown>>({
    windowPresent: typeof window !== "undefined",
    sdkDetected: Boolean(sdk),
  });

  // Dynamically load the Neynar Mini App provider only when the runtime is
  // both browser-based and actually running inside a Farcaster Mini App.
  useEffect(() => {
    let isCancelled = false;
    let initializationStep = "start";

    setStatus("initializing");
    setWrapMode("pending");
    setInitializationError(null);
    setProviderError(null);

    // Attempt to detect the mini app environment and lazily import the
    // Neynar provider. Each stage logs its progress so Neynar dashboards and
    // support tickets have enough breadcrumbs to diagnose failures.
    const initializeProvider = async () => {
      try {
        logNeynarDebug("Starting Neynar provider initialization", {
          windowPresent: typeof window !== "undefined",
          sdkPresent: Boolean(sdk),
        });

        initializationStep = "environment-check";
        if (typeof window === "undefined" || !sdk) {
          // Server-side rendering or missing SDK — we cannot initialize Neynar
          // so we quietly disable the integration.
          logNeynarWarning("Neynar SDK is unavailable in the current environment", {
            windowPresent: typeof window !== "undefined",
            sdkPresent: Boolean(sdk),
          });
          if (!isCancelled) {
            setStatus("skipped");
            setWrapMode("disabled");
          }
          return;
        }

        let isMiniApp = false;

        try {
          // The SDK exposes synchronous and async versions of `isInMiniApp`.
          // Support both styles so we can follow the Neynar API regardless of
          // version.
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
          // When not in a mini app (e.g. normal web browsing) we skip mounting
          // the Neynar provider to avoid unnecessary script execution.
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
          if (!isCancelled) {
            setStatus("skipped");
            setWrapMode("disabled");
          }
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
          // Success! Mount the provider on the next render pass.
          setProviderComponent(() => MiniAppProvider as MiniAppProviderComponent);
          setWrapMode("enabled");
          setStatus("ready");
          setBoundaryKey((key) => key + 1);
          setProviderError(null);
          logNeynarInfo("Successfully initialized Neynar MiniAppProvider", {
            initializationStep,
          });
          lastKnownContext.current = {
            ...lastKnownContext.current,
            initializationStep,
            providerFound: true,
          };
        } else {
          // The expected export was missing — capture the module shape so we
          // can compare against Neynar's documented API when debugging.
          lastKnownContext.current = {
            ...lastKnownContext.current,
            initializationStep,
            providerFound: false,
          };
          logNeynarWarning("@neynar/react did not expose a MiniAppProvider function", {
            availableKeys: Object.keys(module ?? {}),
          });
          if (!isCancelled) {
            setInitializationError(
              new Error("MiniAppProvider export was not found in @neynar/react"),
            );
            setStatus("error");
            setWrapMode("disabled");
          }
        }
      } catch (error) {
        // Any runtime error from detection or dynamic import disables the
        // provider but leaves the rest of the app functional.
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
          setProviderError(normalizedError);
          setStatus("error");
          setWrapMode("disabled");
        }
      }
    };

    void initializeProvider();

    return () => {
      // Mark the async flow as cancelled so we do not update React state after
      // the component unmounts.
      isCancelled = true;
      logNeynarDebug("Cleaning up Neynar provider initialization effect", {
        initializationStep,
      });
    };
  }, []);

  const handleProviderRuntimeError = (error: Error, info: ErrorInfo) => {
    // If the Neynar provider crashes after mounting, log it, tear it down, and
    // show the user-facing banner with recovery guidance.
    const normalizedError = logNeynarError(
      "Neynar Mini App provider threw during render",
      error,
      {
        ...lastKnownContext.current,
        componentStack: info.componentStack,
      }
    );

    setProviderError(normalizedError);
    setWrapMode("disabled");
    setStatus("error");
    setProviderComponent(null);
  };

  const shouldShowBanner = status === "error" && (providerError || initializationError);
  const bannerError = providerError ?? initializationError;

  if (wrapMode !== "enabled" || !ProviderComponent) {
    // Without a valid provider we render children directly, optionally
    // prefixed with a status banner so regular web flows continue to work.
    return (
      <>
        {shouldShowBanner && <NeynarStatusBanner error={bannerError} />}
        {children}
      </>
    );
  }

  return (
    <>
      {shouldShowBanner && <NeynarStatusBanner error={bannerError} />}
      <NeynarRenderBoundary key={boundaryKey} onError={handleProviderRuntimeError}>
        <ProviderComponent analyticsEnabled backButtonEnabled>
          {children}
        </ProviderComponent>
      </NeynarRenderBoundary>
    </>
  );
};

export default NeynarProvider;
