# LNDY - Social Lending Platform

LNDY is a decentralized social lending platform that allows users to request loans with custom terms and have their social network fund them by minting ERC-1155 NFTs. Once a loan is fully funded, the NFTs become tradable.

## Features

- Create loan requests with custom terms (amount, interest rate, duration)
- Fund loans by minting NFTs
- View and manage your created loans and investments
- Trade NFTs once loans are activated
- Repay loans and claim returns

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Blockchain Integration**: thirdweb SDK
- **Smart Contracts**: Solidity (ERC-1155)
- **Network**: Ethereum Mainnet

## Project Structure

```
lndy-app/
├── contracts/           # Smart contracts
│   └── src/
│       ├── LndyLauncher.sol  # Factory contract for creating loans
│       └── LndyLoan.sol      # ERC-1155 contract for loan NFTs
└── frontend/            # React frontend
    ├── public/
    └── src/
        ├── components/  # React components
        ├── hooks/       # Custom React hooks
        └── types/       # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js and npm
- Metamask or another Web3 wallet

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd lndy-app
   ```

2. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

3. Create a `.env` file in the root directory with your thirdweb client ID:
   ```
   VITE_THIRDWEB_CLIENT_ID=your-client-id
   VITE_LAUNCHER_CONTRACT_ADDRESS=your-launcher-contract-address
   ```

   **Important**: Get your Thirdweb Client ID from [Thirdweb Dashboard](https://thirdweb.com/dashboard)

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Smart Contract Deployment

1. Install thirdweb CLI:
   ```
   npm install -g @thirdweb-dev/cli
   ```

2. Deploy the contracts to Ethereum mainnet:
   ```
   cd contracts
   thirdweb deploy
   ```

3. Follow the prompts to deploy your contracts
4. Update the `.env` file with your deployed contract addresses

## Usage

1. Connect your wallet using the "Connect Wallet" button
2. Create a loan by filling out the form in the "Create Loan" tab
3. Browse available loans in the "Browse Loans" tab
4. Fund loans by clicking the "Fund This Loan" button
5. View your created loans and investments in the "My Dashboard" tab

## License

MIT
