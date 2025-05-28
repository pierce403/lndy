// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC contract for testing with 6 decimals like real USDC
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6; // USDC has 6 decimals
    }

    /**
     * @dev Mint tokens for testing purposes
     * @param to Address to mint tokens to
     * @param amount Amount to mint (in USDC units with 6 decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens for testing purposes
     * @param from Address to burn tokens from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }

    /**
     * @dev Helper function to convert dollars to USDC units
     * @param dollarAmount Dollar amount (e.g., 100 for $100)
     * @return USDC amount with 6 decimals
     */
    function dollars(uint256 dollarAmount) external pure returns (uint256) {
        return dollarAmount * 1e6;
    }
} 