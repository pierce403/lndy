// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/LNDY.sol";

contract LNDYTest is Test {
    LNDY public token;
    
    // Test addresses
    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");
    
    // Constants
    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 10**18; // 10 million tokens
    uint256 public constant TRANSFER_AMOUNT = 1000 * 10**18; // 1,000 tokens
    uint256 public constant BURN_AMOUNT = 500 * 10**18; // 500 tokens
    
    // Events to test
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    function setUp() public {
        // Deploy LNDY token with owner as initial owner
        vm.startPrank(owner);
        token = new LNDY(owner);
        vm.stopPrank();
    }
    
    function testTokenCreation() public {
        // Test initial state
        assertEq(token.name(), "LNDY");
        assertEq(token.symbol(), "LNDY Protocol Token");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(token.owner(), owner);
    }
    
    function testTransfer() public {
        // Owner transfers tokens to user1
        vm.startPrank(owner);
        
        vm.expectEmit(true, true, false, true);
        emit Transfer(owner, user1, TRANSFER_AMOUNT);
        
        bool success = token.transfer(user1, TRANSFER_AMOUNT);
        assertTrue(success);
        
        assertEq(token.balanceOf(user1), TRANSFER_AMOUNT);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - TRANSFER_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testApproveAndTransferFrom() public {
        // Owner approves user1 to spend tokens
        vm.startPrank(owner);
        
        vm.expectEmit(true, true, false, true);
        emit Approval(owner, user1, TRANSFER_AMOUNT);
        
        bool success = token.approve(user1, TRANSFER_AMOUNT);
        assertTrue(success);
        assertEq(token.allowance(owner, user1), TRANSFER_AMOUNT);
        
        vm.stopPrank();
        
        // User1 transfers tokens from owner to user2
        vm.startPrank(user1);
        
        vm.expectEmit(true, true, false, true);
        emit Transfer(owner, user2, TRANSFER_AMOUNT);
        
        success = token.transferFrom(owner, user2, TRANSFER_AMOUNT);
        assertTrue(success);
        
        assertEq(token.balanceOf(user2), TRANSFER_AMOUNT);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - TRANSFER_AMOUNT);
        assertEq(token.allowance(owner, user1), 0);
        
        vm.stopPrank();
    }
    
    function testBurnTokens() public {
        // Owner transfers some tokens to user1 first
        vm.startPrank(owner);
        token.transfer(user1, TRANSFER_AMOUNT);
        vm.stopPrank();
        
        uint256 initialTotalSupply = token.totalSupply();
        uint256 initialUser1Balance = token.balanceOf(user1);
        
        // User1 burns their tokens
        vm.startPrank(user1);
        
        vm.expectEmit(true, true, false, true);
        emit Transfer(user1, address(0), BURN_AMOUNT);
        
        token.burn(BURN_AMOUNT);
        
        // Check that total supply decreased
        assertEq(token.totalSupply(), initialTotalSupply - BURN_AMOUNT);
        assertEq(token.balanceOf(user1), initialUser1Balance - BURN_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testBurnFrom() public {
        // Owner transfers tokens to user1
        vm.startPrank(owner);
        token.transfer(user1, TRANSFER_AMOUNT);
        vm.stopPrank();
        
        // User1 approves user2 to burn their tokens
        vm.startPrank(user1);
        token.approve(user2, BURN_AMOUNT);
        vm.stopPrank();
        
        uint256 initialTotalSupply = token.totalSupply();
        uint256 initialUser1Balance = token.balanceOf(user1);
        
        // User2 burns tokens from user1's account
        vm.startPrank(user2);
        
        vm.expectEmit(true, true, false, true);
        emit Transfer(user1, address(0), BURN_AMOUNT);
        
        token.burnFrom(user1, BURN_AMOUNT);
        
        // Check that total supply and balances decreased correctly
        assertEq(token.totalSupply(), initialTotalSupply - BURN_AMOUNT);
        assertEq(token.balanceOf(user1), initialUser1Balance - BURN_AMOUNT);
        assertEq(token.allowance(user1, user2), 0);
        
        vm.stopPrank();
    }
    
    function testCannotBurnMoreThanBalance() public {
        // Try to burn more tokens than user has
        vm.startPrank(user1);
        
        vm.expectRevert(); // Should revert with insufficient balance
        token.burn(1);
        
        vm.stopPrank();
    }
    
    function testCannotBurnFromWithoutAllowance() public {
        // Owner has tokens but user2 has no allowance to burn them
        vm.startPrank(user2);
        
        vm.expectRevert(); // Should revert with insufficient allowance
        token.burnFrom(owner, BURN_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testCannotTransferMoreThanBalance() public {
        // User1 has no tokens, try to transfer
        vm.startPrank(user1);
        
        vm.expectRevert(); // Should revert with insufficient balance
        token.transfer(user2, 1);
        
        vm.stopPrank();
    }
    
    function testMultipleBurns() public {
        // Test multiple burns to verify total supply decreases correctly
        vm.startPrank(owner);
        
        uint256 initialSupply = token.totalSupply();
        uint256 firstBurn = 1000 * 10**18;
        uint256 secondBurn = 2000 * 10**18;
        
        // First burn
        token.burn(firstBurn);
        assertEq(token.totalSupply(), initialSupply - firstBurn);
        
        // Second burn
        token.burn(secondBurn);
        assertEq(token.totalSupply(), initialSupply - firstBurn - secondBurn);
        
        vm.stopPrank();
    }
    
    function testLargeTransfersAndBurns() public {
        // Test with large amounts to ensure no overflow issues
        uint256 largeAmount = 1_000_000 * 10**18; // 1 million tokens
        
        vm.startPrank(owner);
        
        // Transfer large amount
        token.transfer(user1, largeAmount);
        assertEq(token.balanceOf(user1), largeAmount);
        
        vm.stopPrank();
        
        // Burn large amount
        vm.startPrank(user1);
        token.burn(largeAmount);
        assertEq(token.balanceOf(user1), 0);
        assertEq(token.totalSupply(), INITIAL_SUPPLY - largeAmount);
        
        vm.stopPrank();
    }
    
    function testOwnershipFunctionality() public {
        // Test that ownership works correctly
        assertEq(token.owner(), owner);
        
        // Owner can transfer ownership
        vm.startPrank(owner);
        token.transferOwnership(user1);
        assertEq(token.owner(), user1);
        
        vm.stopPrank();
    }
    
    function testTokenSupplyNeverNegative() public {
        // Burn all tokens and verify supply is 0, not negative
        vm.startPrank(owner);
        
        uint256 totalSupply = token.totalSupply();
        token.burn(totalSupply);
        
        assertEq(token.totalSupply(), 0);
        assertEq(token.balanceOf(owner), 0);
        
        vm.stopPrank();
    }
} 