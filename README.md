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
- **Network**: Base

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
- Base network configured in your wallet

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd lndy-app
   ```

2. Install frontend dependencies:
   ```
   npm install
   ```

3. Configure your environment variables:
   ```
   cp env.template .env
   ```
   
   Then edit `.env` with your actual values:
   - Get your Thirdweb Client ID from [Thirdweb Dashboard](https://thirdweb.com/dashboard)
   - Deploy contracts to Base and add the launcher contract address

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

2. Deploy the contracts to Base:
   ```
   cd contracts
   thirdweb deploy
   ```

3. Follow the prompts to deploy your contracts to Base network
4. Update the `.env` file with your deployed contract addresses

### Base Network Setup

To use this app, you'll need to:

1. Add Base network to your wallet (if not already added)
2. Get some ETH on Base for transaction fees
3. Connect your wallet and ensure you're on the Base network

## Usage

1. Connect your wallet using the "Connect Wallet" button
2. Ensure you're connected to Base network
3. Create a loan by filling out the form in the "Create Loan" tab
4. Browse available loans in the "Browse Loans" tab
5. Fund loans by clicking the "Fund This Loan" button
6. View your created loans and investments in the "My Dashboard" tab

## License

MIT
