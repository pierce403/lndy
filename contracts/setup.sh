#!/bin/bash

# LNDY Smart Contracts Setup Script
# This script sets up the Foundry testing environment for LNDY contracts

set -e  # Exit on any error

echo "🚀 Setting up LNDY Smart Contracts Testing Environment..."

# Check if foundry is installed
if ! command -v forge &> /dev/null; then
    echo "📦 Foundry not found. Installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    source ~/.bashrc || source ~/.zshrc || true
    foundryup
else
    echo "✅ Foundry is already installed"
fi

# Verify forge is working
if ! command -v forge &> /dev/null; then
    echo "❌ Foundry installation failed. Please install manually:"
    echo "   curl -L https://foundry.paradigm.xyz | bash"
    echo "   Then restart your terminal and run: foundryup"
    exit 1
fi

echo "📁 Current directory: $(pwd)"

# Install dependencies if they don't exist
if [ ! -d "lib/forge-std" ]; then
    echo "📦 Installing forge-std..."
    forge install foundry-rs/forge-std --no-commit
else
    echo "✅ forge-std already installed"
fi

if [ ! -d "lib/openzeppelin-contracts" ]; then
    echo "📦 Installing OpenZeppelin contracts..."
    forge install OpenZeppelin/openzeppelin-contracts --no-commit
else
    echo "✅ OpenZeppelin contracts already installed"
fi

# Compile contracts
echo "🔨 Compiling contracts..."
if forge build; then
    echo "✅ Contracts compiled successfully"
else
    echo "❌ Contract compilation failed"
    exit 1
fi

# Run tests
echo "🧪 Running test suite..."
if forge test; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed. Check the output above for details."
fi

echo ""
echo "🎉 Setup complete! Here are some useful commands:"
echo ""
echo "📋 Basic Commands:"
echo "  forge build          # Compile contracts"
echo "  forge test           # Run all tests"
echo "  forge test -vvv      # Run tests with verbose output"
echo ""
echo "🔍 Specific Tests:"
echo "  forge test --match-contract LndyLoanTest       # Test loan contract"
echo "  forge test --match-contract LndyLauncherTest   # Test launcher contract"
echo "  forge test --match-test testFullRepaymentCycle # Test specific scenario"
echo ""
echo "📊 Advanced Commands:"
echo "  forge test --gas-report   # Show gas usage"
echo "  forge coverage           # Generate coverage report"
echo "  forge doc               # Generate documentation"
echo ""
echo "🏗️  Development:"
echo "  forge create src/LndyLauncher.sol:LndyLauncher --private-key <key> --rpc-url <url>"
echo "  forge verify-contract <address> src/LndyLauncher.sol:LndyLauncher --chain <id>"
echo ""
echo "📖 See README.md for detailed documentation and testing scenarios." 