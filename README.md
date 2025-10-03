# LNDY - Social Lending Platform

LNDY is a decentralized social lending platform that allows users to request loans with custom terms and have their social network fund them by minting ERC-1155 NFTs. Each contribution creates a unique NFT that serves as both a badge of social impact and a claim on returns. Supporters can claim returns incrementally as repayments are made, and NFTs remain as permanent keepsakes.

## Features

### 🎯 Social Lending
- Create loan requests with social-friendly terms ("Thank You Amount" instead of interest)
- Community funding through NFT purchases
- Target repayment timeframes instead of strict deadlines
- Repayment health tracking (time vs. progress)

### 🖼️ NFT Innovations  
- Each contribution gets a unique ERC-1155 token with distinct value
- Rich OpenSea-compatible metadata showing contribution impact
- Permanent keepsakes (NFTs never burn, even after completion)
- Progressive status tracking: Funding → Active → Completed

### 💰 Flexible Returns
- **Partial Claims**: Claim returns incrementally as repayments come in
- **USDC-based**: All transactions in USDC on Base network
- **Failed Funding Protection**: Withdraw contributions if funding fails
- **Social Accountability**: Visual progress tracking without penalties

### 🔥 LNDY Protocol Token
- **ERC20 Token**: 10 million total supply with burn functionality
- **Deflationary**: Users can permanently burn tokens to reduce supply
- **Governance Ready**: Owned contract for future DAO implementation

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Blockchain**: Base Network (Ethereum L2)
- **Smart Contracts**: Solidity with OpenZeppelin
- **Token Standard**: ERC-1155 (loan NFTs) + ERC20 (LNDY token)
- **Currency**: USDC (6 decimals)
- **Testing**: Foundry/Forge with comprehensive test suites
- **Development**: thirdweb SDK for Web3 integration

## Project Structure

```
lndy/
├── contracts/                    # Smart contract infrastructure
│   ├── src/
│   │   ├── LndyLauncher.sol     # Factory contract for creating loans
│   │   ├── LndyLoan.sol         # ERC-1155 loan NFT contract with USDC
│   │   └── LNDY.sol             # ERC20 protocol token (burnable)
│   ├── test/
│   │   ├── LndyLauncher.t.sol   # Factory contract tests
│   │   ├── LndyLoan.t.sol       # Comprehensive loan tests (16 tests)
│   │   ├── LNDY.t.sol           # Token contract tests (12 tests)
│   │   └── mocks/
│   │       └── MockUSDC.sol     # Mock USDC for testing
│   ├── foundry.toml             # Foundry configuration
│   ├── setup.sh                 # Automated setup script
│   └── README.md                # Detailed testing documentation
├── src/                         # React frontend
│   ├── components/              # React components
│   ├── hooks/                   # Custom React hooks  
│   ├── lib/                     # Web3 client configuration
│   └── types/                   # TypeScript definitions
├── env.template                 # Environment template
└── MIGRATION_TO_BASE.md         # Base network migration guide
```

## Getting Started

### Prerequisites

- **Node.js** and npm/yarn
- **Foundry** for smart contract development and testing
- **MetaMask** or another Web3 wallet
- **Base network** configured in your wallet
- **USDC on Base** for testing loan functionality

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pierce403/lndy.git
   cd lndy
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Set up smart contract testing:**
   ```bash
   cd contracts
   chmod +x setup.sh
   ./setup.sh
   ```

4. **Run all tests:**
   ```bash
   forge test
   ```

5. **Configure environment:**
   ```bash
   cp env.template .env
   # Edit .env with your values
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

### Smart Contract Development

The contracts use **Foundry** for development and testing:

```bash
cd contracts

# Compile contracts
forge build

# Run all tests (29 tests total)
forge test

# Run with gas reporting
forge test --gas-report

# Run specific test
forge test --match-contract LNDYTest

# Generate coverage report
forge coverage
```

### Contract Addresses (Base Mainnet)

- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **LndyLauncher**: `0x1e5a41abf9a83e1346978414ae4e001b50b0431f`
- **LNDY Token**: *Deploy using Foundry*

### Base Network Setup

1. **Add Base to MetaMask:**
   - Network Name: Base
   - RPC URL: `https://mainnet.base.org`
   - Chain ID: `8453`
   - Currency Symbol: `ETH`

2. **Get USDC on Base:**
   - Bridge from Ethereum mainnet
   - Use Base bridge: https://bridge.base.org
   - Buy directly on Base DEXs

## Key Contracts

### 🏭 **LndyLauncher.sol**
Factory contract that creates and tracks loan instances.

### 🏠 **LndyLoan.sol**  
Core loan contract featuring:
- USDC-based lending with automatic fund transfer
- Unique NFT minting per contribution
- Partial repayment and incremental claiming
- Rich metadata for OpenSea integration
- Failed funding protection with withdrawals

### 🪙 **LNDY.sol**
Protocol token with:
- 10M initial supply minted to deployer
- Burn functionality to reduce total supply
- Standard ERC20 compatibility

## Testing

Comprehensive test coverage with **29 passing tests**:

- ✅ **LndyLauncher**: 4 tests (factory functionality)
- ✅ **LndyLoan**: 16 tests (funding, repayment, claims, NFTs)  
- ✅ **LNDY**: 12 tests (transfers, burns, edge cases)

Run tests: `cd contracts && forge test`

## Deployment

### Using Foundry (Recommended)

```bash
# Deploy to Base mainnet
forge create src/LNDY.sol:LNDY \
  --private-key $PRIVATE_KEY \
  --rpc-url https://mainnet.base.org \
  --constructor-args $OWNER_ADDRESS

forge create src/LndyLauncher.sol:LndyLauncher \
  --private-key $PRIVATE_KEY \
  --rpc-url https://mainnet.base.org
```

### Using thirdweb

```bash
cd contracts
thirdweb deploy
```

## Social Features

### 🤝 **Social-First Design**
- "Thank You Amount" instead of "Interest Rate"  
- "Target Repayment Timeframe" instead of "Loan Duration"
- Community support through NFT collection
- Repayment health indicators (Green/Yellow/Red)

### 🎮 **Gamification**
- NFT badges showing social impact
- Supporter portfolios of social good
- "I helped fund this person's dream" collectibles
- Progressive status evolution in metadata

## MiniApp Notifications

This MiniApp implements comprehensive notification behaviors for Farcaster users:

### 🔔 **Notification Types**

- **New Loan Creation**: All users who have added the MiniApp will receive a notification whenever a new loan is created, keeping the community informed about new funding opportunities.

- **Loan Contribution**: Loan creators will receive a notification each time someone contributes to their loan, providing real-time updates on funding progress.

- **Loan Repayment**: Contributors will receive a notification whenever a loan they contributed to is repaid, including partial repayments, ensuring transparency in the repayment process.

### 📱 **How to Enable Notifications**

To receive these notifications:
1. Open the LNDY MiniApp within your Farcaster client
2. Ensure you have added the MiniApp to your Farcaster account
3. Notifications will automatically appear in your Farcaster feed when relevant events occur

### 🎯 **Notification Benefits**

- **Real-time Updates**: Stay informed about loan activity without constantly checking the app
- **Community Engagement**: Know when new opportunities arise or when your loans receive support
- **Transparency**: Track repayment progress and maintain accountability in the lending process
- **Social Connection**: Feel connected to the community through shared financial support

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Write tests for new functionality
4. Ensure all tests pass: `forge test`
5. Commit changes: `git commit -m "Add feature"`
6. Push to branch: `git push origin feature-name`
7. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Links

- **Website**: [LNDY.org](https://lndy.org) 
- **Base Network**: [base.org](https://base.org)
- **OpenSea**: NFTs visible once deployed
- **Documentation**: See `contracts/README.md` for detailed testing docs

