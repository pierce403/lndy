import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("thirdweb/react", () => ({
  ThirdwebProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  ConnectButton: ({ children }: { children?: ReactNode }) => (
    <button type="button" data-testid="connect-button">
      {children ?? "Connect Wallet"}
    </button>
  ),
  useActiveWallet: () => null,
  useConnectModal: () => ({ isConnecting: false }),
}));

vi.mock("thirdweb", () => ({
  createThirdwebClient: () => ({ clientId: "mock-client" }),
}));

vi.mock("thirdweb/chains", () => ({
  base: { id: 1, name: "Base" },
}));

vi.mock("thirdweb/wallets", () => ({
  createWallet: () => ({}),
  walletConnect: () => ({}),
}));

vi.mock("@farcaster/miniapp-sdk", () => ({
  sdk: {
    actions: { ready: vi.fn(() => Promise.resolve()) },
    wallet: { getEthereumProvider: vi.fn(() => Promise.resolve(null)) },
    isInMiniApp: vi.fn(() => false),
    context: Promise.resolve({ user: null }),
  },
}));

vi.mock("@neynar/react", () => ({
  MiniAppProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("./components/NeynarProvider", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("./context/FarcasterWalletContext", () => ({
  FarcasterWalletProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useFarcasterWalletContext: () => ({
    wallet: null,
    isLoading: false,
    connect: vi.fn(),
    isConnected: false,
    error: null,
    isDisabled: true,
  }),
}));

vi.mock("./hooks/useIsFarcasterPreferred", () => ({
  useIsFarcasterPreferred: () => false,
}));

vi.mock("./hooks/useLoans", () => ({
  useLoans: () => ({
    loans: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("./components/CreateLoan", () => ({
  default: () => <div data-testid="create-loan" />, 
}));

vi.mock("./components/LoanList", () => ({
  default: () => <div data-testid="loan-list">Loan list ready</div>,
}));

vi.mock("./components/Dashboard", () => ({
  default: () => <div data-testid="dashboard" />, 
}));

vi.mock("./pages/MyLoans", () => ({
  default: () => <div data-testid="my-loans" />, 
}));

vi.mock("./components/About", () => ({
  default: () => <div data-testid="about" />, 
}));

vi.mock("./components/NotificationSetup", () => ({
  default: () => <div data-testid="notification-setup">Notifications ready</div>,
}));

import App from "./App";

describe("App", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_THIRDWEB_CLIENT_ID", "test-client-id");
  });

  it("renders the main application shell without crashing", async () => {
    render(<App />);

    expect(await screen.findByText("LNDY")).toBeInTheDocument();
    expect(screen.getByTestId("loan-list")).toBeInTheDocument();
    expect(screen.queryByText("Configuration Error")).not.toBeInTheDocument();
  });
});
