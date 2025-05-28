# LNDY Smart Contracts Testing Infrastructure

This directory contains the smart contracts for the LNDY social lending platform and a comprehensive testing suite built with Foundry/Forge.

## Overview

LNDY is a decentralized social lending platform where:
- Borrowers create loan requests with social-friendly terms
- Community members support loans by purchasing NFTs representing their contributions
- Each contribution gets a unique NFT token that serves as both a badge and a claim on returns
- Supporters can claim returns incrementally as the borrower makes repayments
- NFTs remain as permanent keepsakes showing social impact

## Contracts

### `LndyLoan.sol`
The main loan contract that:
- Manages individual loans funded by USDC
- Issues ERC1155 NFTs to supporters with rich OpenSea metadata
- Handles partial repayments and incremental claims
- Provides repayment health tracking
- Uses "Thank You Amount" instead of interest for social-friendly UX

### `LndyLauncher.sol`
Factory contract that:
- Creates new `LndyLoan` instances
- Tracks all loans by borrower and globally
- Validates loan parameters before deployment

### `MockUSDC.sol` (Test Helper)
Mock USDC contract for testing with:
- 6 decimals like real USDC
- Mint/burn functions for test scenarios
- Helper functions for dollar conversion

## Testing Infrastructure

Built with **Foundry** for fast, comprehensive testing of lending scenarios.

### Test Coverage

#### `LndyLoan.t.sol`
- **Loan Creation**: Verifies correct parameter setup and total repayment calculation
- **Single Supporter Funding**: Tests full loan funding by one supporter
- **Multiple Supporter Funding**: Tests collaborative funding scenarios
- **Partial Repayments & Claims**: Tests incremental claiming as repayments are made
- **Full Repayment Cycle**: Tests complete loan lifecycle
- **Funding Deadline Expiry**: Tests fund withdrawal when funding fails
- **Edge Cases**: Overfunding protection, deadline enforcement
- **Repayment Health**: Tests time vs repayment progress tracking
- **NFT Metadata**: Tests OpenSea-compatible metadata generation
- **Token Management**: Tests multi-token scenarios per supporter

#### `LndyLauncher.t.sol`
- **Loan Creation**: Tests factory deployment of new loans
- **Multi-Borrower Support**: Tests multiple borrowers creating loans
- **Loan Tracking**: Tests borrower and global loan queries
- **Validation**: Tests parameter validation and error cases

### Key Test Scenarios

1. **Happy Path**: Full funding → Partial repayments → Incremental claims → Full repayment
2. **Failed Funding**: Partial funding → Deadline expires → Funds withdrawn
3. **Social Gaming**: Multiple small contributions → Community building → Keepsake NFTs
4. **Partial Claims**: Real-time claiming as repayments come in (no waiting for full repayment)

## Installation & Setup

### Prerequisites
- [Foundry](https://getfoundry.sh/) installed
- Git for dependency management

### Quick Start

```bash
# Install Foundry if you haven't already
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Navigate to contracts directory
cd contracts

# Install dependencies
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts

# Compile contracts
forge build

# Run all tests
forge test

# Run tests with verbosity
forge test -vvv

# Run specific test contract
forge test --match-contract LndyLoanTest

# Run specific test function
forge test --match-test testSingleSupporterFullFunding

# Run tests with gas reporting
forge test --gas-report

# Generate coverage report
forge coverage
```

### Test Configuration

The test suite uses:
- **Fuzz Testing**: 1000 runs to find edge cases
- **Mock USDC**: 6-decimal precision matching real USDC
- **Time Manipulation**: Fast-forward testing for deadlines and repayment schedules
- **Event Testing**: Verification of all contract events
- **State Validation**: Comprehensive state checks after each operation

## Running Specific Scenarios

### Test a Full Loan Lifecycle
```bash
forge test --match-test testFullRepaymentCycle -vvv
```

### Test Failed Funding Scenario
```bash
forge test --match-test testFundingDeadlineExpiry -vvv
```

### Test Incremental Claims
```bash
forge test --match-test testIncrementalClaimingScenario -vvv
```

### Test NFT Functionality
```bash
forge test --match-test testNFTMetadata -vvv
```

## Contract Addresses

### Base Mainnet
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### Test Networks
Deploy your own instances for testing on Base Sepolia or local networks.

## Development

### Adding New Tests

1. Create test functions starting with `test`
2. Use `vm.startPrank(address)` for impersonation
3. Use `vm.expectRevert("message")` for error testing
4. Use `vm.expectEmit()` for event testing
5. Use helper functions like `_fundLoanCompletely()` for setup

### Test Helpers

- `makeAddr("name")`: Creates deterministic test addresses
- `vm.warp(timestamp)`: Fast-forward time for deadline testing
- `usdc.mint(address, amount)`: Give test USDC to addresses
- `assertApproxEqAbs(a, b, delta)`: Compare values with tolerance

### Best Practices

- Test both success and failure cases
- Verify state changes after each operation
- Test edge cases like zero amounts and boundary conditions
- Use meaningful assertion messages
- Group related tests logically

## Architecture Highlights

### Social-First Design
- "Thank You Amount" instead of "Interest Rate" 
- NFTs as permanent badges of social good
- Incremental claims for immediate liquidity
- Rich metadata showing contribution impact

### Security Features
- ReentrancyGuard on all state-changing functions
- Comprehensive input validation
- Safe math operations
- Access control for borrower-only functions

### NFT Innovation
- Each contribution = unique token with distinct value
- OpenSea-compatible metadata with status tracking
- Permanent keepsakes (no burning after completion)
- Progressive claiming without losing the NFT

## Gas Optimization

The contracts are optimized for:
- Batch operations where possible
- Efficient storage layouts
- Minimal external calls
- Event-driven frontend updates

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure 100% test coverage for new code
3. Add both positive and negative test cases
4. Update documentation and comments
5. Run full test suite before committing

## License

MIT License - see LICENSE file for details. 