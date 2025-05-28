// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LNDY Token
 * @dev ERC20 token for the LNDY social lending platform with burn functionality
 * 
 * Features:
 * - Total supply: 10,000,000 LNDY tokens
 * - 18 decimals (standard ERC20)
 * - Burnable: Users can burn their tokens to reduce total supply
 * - Initial supply minted to deployer
 */
contract LNDY is ERC20, ERC20Burnable, Ownable {
    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 10**18; // 10 million tokens
    
    /**
     * @dev Constructor that mints the initial supply to the deployer
     * @param initialOwner Address that will own the contract and receive initial supply
     */
    constructor(address initialOwner) ERC20("LNDY", "LNDY Protocol Token") Ownable(initialOwner) {
        _mint(initialOwner, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Returns the number of decimals used to get its user representation
     * @return The number of decimals (18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
    
    /**
     * @dev Allows users to burn tokens from their own balance
     * This function is inherited from ERC20Burnable
     * @param amount Amount of tokens to burn
     */
    // function burn(uint256 amount) public virtual override {
    //     super.burn(amount);
    // }
    
    /**
     * @dev Allows users to burn tokens from another account (with allowance)
     * This function is inherited from ERC20Burnable
     * @param account Account to burn tokens from
     * @param amount Amount of tokens to burn
     */
    // function burnFrom(address account, uint256 amount) public virtual override {
    //     super.burnFrom(account, amount);
    // }
} 