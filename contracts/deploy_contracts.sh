#!/bin/bash

# LNDY Contract Deployment Script for Base Mainnet
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK="base"
RPC_URL="https://mainnet.base.org"
CHAIN_ID=8453
DEPLOYER_FILE=".deployer"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   LNDY Contract Deployment Script     ║"
echo "║   Network: Base Mainnet                ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables if .env exists
if [ -f ".env" ]; then
    source .env
    echo -e "${GREEN}✓ Loaded .env file${NC}"
elif [ -f "../.env" ]; then
    source ../.env
    echo -e "${GREEN}✓ Loaded ../.env file${NC}"
fi

echo ""

# Check if private key exists (prioritize .env, then .deployer file)
if [ -n "$PRIVATE_KEY" ]; then
    # Use private key from environment
    ADDRESS=$(cast wallet address --private-key "$PRIVATE_KEY")
    echo -e "${GREEN}✓ Using private key from .env${NC}"
    echo -e "Address: ${GREEN}$ADDRESS${NC}"
elif [ -f "$DEPLOYER_FILE" ]; then
    # Use private key from .deployer file
    PRIVATE_KEY=$(cat "$DEPLOYER_FILE")
    ADDRESS=$(cast wallet address --private-key "$PRIVATE_KEY")
    echo -e "${GREEN}✓ Using existing deployer wallet from .deployer file${NC}"
    echo -e "Address: ${GREEN}$ADDRESS${NC}"
else
    # Generate new wallet
    echo -e "${YELLOW}⚠ No private key found. Generating a new deployer wallet...${NC}"
    echo ""
    
    # Generate new wallet (capture full output including mnemonic)
    WALLET_OUTPUT=$(cast wallet new)
    
    # Extract address and private key using grep and awk
    ADDRESS=$(echo "$WALLET_OUTPUT" | grep "Address:" | awk '{print $2}')
    PRIVATE_KEY=$(echo "$WALLET_OUTPUT" | grep "Private key:" | awk '{print $3}')
    
    # Extract the mnemonic (it's on the line after "Mnemonic:")
    MNEMONIC=$(echo "$WALLET_OUTPUT" | grep -A 1 "Mnemonic:" | tail -n 1 | xargs)
    
    # Save private key to file
    echo "$PRIVATE_KEY" > "$DEPLOYER_FILE"
    chmod 600 "$DEPLOYER_FILE"
    
    # Save mnemonic to separate file
    echo "$MNEMONIC" > "${DEPLOYER_FILE}.mnemonic"
    chmod 600 "${DEPLOYER_FILE}.mnemonic"
    
    echo -e "${GREEN}✓ New wallet generated!${NC}"
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo -e "${YELLOW}  IMPORTANT: Save your recovery phrase!${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "${RED}Mnemonic (Seed Phrase):${NC}"
    echo -e "${GREEN}$MNEMONIC${NC}"
    echo ""
    echo -e "This has been saved to: ${BLUE}${DEPLOYER_FILE}.mnemonic${NC}"
    echo -e "${RED}⚠ Keep this phrase safe! Anyone with it can access your wallet.${NC}"
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo -e "${YELLOW}  Fund your deployer wallet${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "Address: ${GREEN}$ADDRESS${NC}"
    echo ""
    echo "Please send ETH (for gas) to this address on Base Mainnet."
    echo "Recommended: 0.01 ETH (~$30 worth) should be enough for deployment."
    echo ""
    echo "You can get Base ETH from:"
    echo "  • Bridge from Ethereum: https://bridge.base.org"
    echo "  • Buy directly on Base: Coinbase, Binance, etc."
    echo ""
    read -p "Press Enter once you've funded the address to continue..."
fi

echo ""

# Check balance
echo -e "${BLUE}Checking wallet balance...${NC}"
BALANCE=$(cast balance "$ADDRESS" --rpc-url "$RPC_URL")
BALANCE_ETH=$(cast to-unit "$BALANCE" ether)

echo -e "Balance: ${GREEN}$BALANCE_ETH ETH${NC}"

if [ "$(echo "$BALANCE_ETH < 0.005" | bc)" -eq 1 ]; then
    echo -e "${RED}⚠ Warning: Balance is low. You may not have enough gas for deployment.${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Starting Contract Deployment${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Build contracts first
echo -e "${BLUE}📦 Building contracts...${NC}"
forge build

echo ""
echo -e "${BLUE}🚀 Deploying LndyLauncher contract...${NC}"

# Deploy LndyLauncher
DEPLOY_OUTPUT=$(forge create \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    --json \
    src/LndyLauncher.sol:LndyLauncher)

LAUNCHER_ADDRESS=$(echo "$DEPLOY_OUTPUT" | jq -r '.deployedTo')

if [ "$LAUNCHER_ADDRESS" == "null" ] || [ -z "$LAUNCHER_ADDRESS" ]; then
    echo -e "${RED}✗ Deployment failed!${NC}"
    echo "$DEPLOY_OUTPUT" | jq '.'
    exit 1
fi

echo -e "${GREEN}✓ LndyLauncher deployed!${NC}"
echo -e "Address: ${GREEN}$LAUNCHER_ADDRESS${NC}"

# Save deployment info
cat > deployment.json << EOF
{
  "network": "base-mainnet",
  "chainId": $CHAIN_ID,
  "deployer": "$ADDRESS",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "LndyLauncher": "$LAUNCHER_ADDRESS"
  }
}
EOF

echo ""
echo -e "${GREEN}✓ Deployment info saved to deployment.json${NC}"

# Verify contract on Blockscout (works better with via-ir than Basescan)
echo ""
echo -e "${BLUE}🔍 Verifying contract on Blockscout...${NC}"

# Wait for the transaction to be indexed
echo "Waiting 10 seconds for transaction to be indexed..."
sleep 10

# Verify using Blockscout (no API key needed, handles via-ir better)
forge verify-contract \
    $LAUNCHER_ADDRESS \
    src/LndyLauncher.sol:LndyLauncher \
    --verifier blockscout \
    --verifier-url "https://base.blockscout.com/api/" \
    --watch && {
        echo -e "${GREEN}✓ Contract verified successfully on Blockscout!${NC}"
        echo "View verified contract: https://base.blockscout.com/address/$LAUNCHER_ADDRESS"
    } || {
        echo -e "${YELLOW}⚠ Blockscout verification failed. You can verify manually:${NC}"
        echo ""
        echo "Blockscout (recommended for via-ir):"
        echo "forge verify-contract $LAUNCHER_ADDRESS src/LndyLauncher.sol:LndyLauncher \\"
        echo "    --verifier blockscout \\"
        echo "    --verifier-url \"https://base.blockscout.com/api/\" \\"
        echo "    --watch"
        echo ""
        if [ -n "$BASESCAN_API_KEY" ]; then
            echo "Or try Basescan:"
            echo "forge verify-contract $LAUNCHER_ADDRESS src/LndyLauncher.sol:LndyLauncher \\"
            echo "    --chain base \\"
            echo "    --etherscan-api-key \$BASESCAN_API_KEY \\"
            echo "    --watch"
        fi
    }

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment Complete! 🎉${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "Deployment Summary:"
echo "  • Network: Base Mainnet"
echo "  • Chain ID: $CHAIN_ID"
echo "  • Deployer: $ADDRESS"
echo "  • LndyLauncher: $LAUNCHER_ADDRESS"
echo ""
echo "Next steps:"
echo "  1. Update your frontend with the new contract address"
echo "  2. Test the deployment by creating a loan"
echo "  3. View on BaseScan: https://basescan.org/address/$LAUNCHER_ADDRESS"
echo ""

