// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/LndyLoan.sol";
import "./mocks/MockUSDC.sol";

contract LndyLoanTest is Test {
    TestableLndyLoan public loan;
    MockUSDC public usdc;
    
    // Test addresses
    address public borrower = makeAddr("borrower");
    address public supporter1 = makeAddr("supporter1");
    address public supporter2 = makeAddr("supporter2");
    address public supporter3 = makeAddr("supporter3");
    
    // Loan parameters
    uint256 public constant LOAN_AMOUNT = 1000 * 1e6; // $1,000 USDC
    uint256 public constant THANK_YOU_AMOUNT = 1000; // 10% in basis points
    uint256 public constant FUNDING_PERIOD = 7 days;
    uint256 public TARGET_REPAYMENT_DATE; // Not constant, set in setUp
    string public constant DESCRIPTION = "Starting a coffee shop in downtown";
    string public constant BASE_IMAGE_URI = "ipfs://QmExampleHash";
    
    event LoanCreated(address indexed borrower, uint256 loanAmount, uint256 thankYouAmount, uint256 targetRepaymentDate, string baseImageURI);
    event LoanSupported(address indexed supporter, uint256 indexed tokenId, uint256 amount);
    event LoanActivated(uint256 totalFunded);
    event RepaymentMade(uint256 amount, uint256 totalRepaid);
    event ReturnsClaimed(address indexed supporter, uint256 indexed tokenId, uint256 amount);

    function setUp() public {
        // Set the target repayment date
        TARGET_REPAYMENT_DATE = block.timestamp + 30 days;
        
        // Deploy mock USDC
        usdc = new MockUSDC();
        
        // Deploy testable loan contract with mock USDC
        vm.startPrank(borrower);
        loan = new TestableLndyLoan(
            LOAN_AMOUNT,
            THANK_YOU_AMOUNT,
            TARGET_REPAYMENT_DATE,
            FUNDING_PERIOD,
            DESCRIPTION,
            BASE_IMAGE_URI,
            borrower,
            address(usdc)
        );
        vm.stopPrank();
        
        // Give supporters some USDC
        usdc.mint(supporter1, 1000 * 1e6);  // $1,000 (enough for full loan)
        usdc.mint(supporter2, 400 * 1e6);   // $400 (increased for testGetSupporterTokenDetails)
        usdc.mint(supporter3, 300 * 1e6);   // $300 (increased from 200)
        usdc.mint(borrower, 1100 * 1e6);    // For repayments
    }
    
    function testLoanCreation() public {
        // Test that loan was created with correct parameters
        (
            uint256 _loanAmount,
            uint256 _thankYouAmount,
            uint256 _targetRepaymentDate,
            uint256 _fundingDeadline,
            string memory _description,
            string memory _baseImageURI,
            address _borrower,
            uint256 _totalFunded,
            uint256 _totalRepaidAmount,
            uint256 _actualRepaidAmount,
            bool _isActive,
            bool _isFullyRepaid
        ) = loan.getLoanDetails();
        
        assertEq(_loanAmount, LOAN_AMOUNT);
        assertEq(_thankYouAmount, THANK_YOU_AMOUNT);
        assertEq(_targetRepaymentDate, TARGET_REPAYMENT_DATE);
        assertEq(_fundingDeadline, block.timestamp + FUNDING_PERIOD);
        assertEq(_description, DESCRIPTION);
        assertEq(_baseImageURI, BASE_IMAGE_URI);
        assertEq(_borrower, borrower);
        assertEq(_totalFunded, 0);
        assertEq(_totalRepaidAmount, 1100 * 1e6); // $1,000 + 10% = $1,100
        assertEq(_actualRepaidAmount, 0);
        assertFalse(_isActive);
        assertFalse(_isFullyRepaid);
    }
    
    function testSingleSupporterFullFunding() public {
        // Supporter1 funds the entire loan
        vm.startPrank(supporter1);
        usdc.approve(address(loan), LOAN_AMOUNT);
        
        vm.expectEmit(true, true, true, true);
        emit LoanSupported(supporter1, 1, LOAN_AMOUNT);
        
        vm.expectEmit(true, false, false, true);
        emit LoanActivated(LOAN_AMOUNT);
        
        loan.supportLoan(LOAN_AMOUNT);
        vm.stopPrank();
        
        // Check loan is now active
        (, , , , , , , , , , bool isActive, ) = loan.getLoanDetails();
        assertTrue(isActive);
        
        // Check supporter received NFT
        assertEq(loan.balanceOf(supporter1, 1), 1);
        
        // Check borrower received funds
        assertEq(usdc.balanceOf(borrower), 1100 * 1e6 + LOAN_AMOUNT);
    }
    
    function testMultipleSupportersPartialFunding() public {
        // Multiple supporters fund parts of the loan
        vm.startPrank(supporter1);
        usdc.approve(address(loan), 400 * 1e6);
        loan.supportLoan(400 * 1e6);
        vm.stopPrank();
        
        vm.startPrank(supporter2);
        usdc.approve(address(loan), 300 * 1e6);
        loan.supportLoan(300 * 1e6);
        vm.stopPrank();
        
        vm.startPrank(supporter3);
        usdc.approve(address(loan), 300 * 1e6);
        loan.supportLoan(300 * 1e6);
        vm.stopPrank();
        
        // Check each supporter has their tokens
        assertEq(loan.balanceOf(supporter1, 1), 1);
        assertEq(loan.balanceOf(supporter2, 2), 1);
        assertEq(loan.balanceOf(supporter3, 3), 1);
        
        // Check loan is active
        (, , , , , , , , , , bool isActive, ) = loan.getLoanDetails();
        assertTrue(isActive);
    }
    
    function testRepaymentAndClaiming() public {
        // Setup: Multiple supporters fund the loan
        _fundLoanCompletely();
        
        // Borrower makes a partial repayment (50% = $550)
        uint256 partialRepayment = 550 * 1e6;
        vm.startPrank(borrower);
        usdc.approve(address(loan), partialRepayment);
        
        vm.expectEmit(true, false, false, true);
        emit RepaymentMade(partialRepayment, partialRepayment);
        
        loan.makeRepayment(partialRepayment);
        vm.stopPrank();
        
        // Supporter1 claims partial returns
        vm.startPrank(supporter1);
        uint256 claimableBefore = loan.getClaimableAmount(1);
        assertGt(claimableBefore, 0);
        
        vm.expectEmit(true, true, true, true);
        emit ReturnsClaimed(supporter1, 1, claimableBefore);
        
        loan.claimReturns(1);
        vm.stopPrank();
        
        // Check that claimable amount is now 0 for this token
        assertEq(loan.getClaimableAmount(1), 0);
    }
    
    function testFullRepaymentCycle() public {
        // Setup: Fund the loan
        _fundLoanCompletely();
        
        // Borrower repays in full
        uint256 fullRepayment = 1100 * 1e6;
        vm.startPrank(borrower);
        usdc.approve(address(loan), fullRepayment);
        loan.makeRepayment(fullRepayment);
        vm.stopPrank();
        
        // Check loan is fully repaid
        (, , , , , , , , , , , bool isFullyRepaid) = loan.getLoanDetails();
        assertTrue(isFullyRepaid);
        
        // All supporters can claim their full returns
        vm.startPrank(supporter1);
        uint256 claimable1 = loan.getClaimableAmount(1);
        loan.claimReturns(1);
        vm.stopPrank();
        
        vm.startPrank(supporter2);
        uint256 claimable2 = loan.getClaimableAmount(2);
        loan.claimReturns(2);
        vm.stopPrank();
        
        vm.startPrank(supporter3);
        uint256 claimable3 = loan.getClaimableAmount(3);
        loan.claimReturns(3);
        vm.stopPrank();
        
        // Check that total claimed equals total repaid
        assertEq(claimable1 + claimable2 + claimable3, fullRepayment);
    }
    
    function testFundingDeadlineExpiry() public {
        // Partial funding before deadline
        vm.startPrank(supporter1);
        usdc.approve(address(loan), 400 * 1e6);
        loan.supportLoan(400 * 1e6);
        vm.stopPrank();
        
        // Fast forward past funding deadline
        vm.warp(block.timestamp + FUNDING_PERIOD + 1);
        
        // Supporters can withdraw their funds
        vm.startPrank(supporter1);
        uint256 balanceBefore = usdc.balanceOf(supporter1);
        loan.withdrawFunds(1);
        uint256 balanceAfter = usdc.balanceOf(supporter1);
        
        assertEq(balanceAfter - balanceBefore, 400 * 1e6);
        vm.stopPrank();
        
        // Token still exists as a keepsake but funds are withdrawn
        assertEq(loan.balanceOf(supporter1, 1), 1);
    }
    
    function testCannotSupportAfterDeadline() public {
        // Fast forward past funding deadline
        vm.warp(block.timestamp + FUNDING_PERIOD + 1);
        
        vm.startPrank(supporter1);
        usdc.approve(address(loan), 100 * 1e6);
        
        vm.expectRevert("Funding period has ended");
        loan.supportLoan(100 * 1e6);
        vm.stopPrank();
    }
    
    function testCannotOverfund() public {
        vm.startPrank(supporter1);
        usdc.approve(address(loan), LOAN_AMOUNT + 1);
        
        vm.expectRevert("Funding amount exceeds loan requirement");
        loan.supportLoan(LOAN_AMOUNT + 1);
        vm.stopPrank();
    }
    
    function testRepaymentHealth() public {
        _fundLoanCompletely();
        
        // Fast forward halfway through the loan period
        uint256 loanDuration = TARGET_REPAYMENT_DATE - (block.timestamp + FUNDING_PERIOD);
        vm.warp(block.timestamp + FUNDING_PERIOD + (loanDuration / 2));
        
        // Make 25% repayment when 50% time has elapsed
        vm.startPrank(borrower);
        usdc.approve(address(loan), 275 * 1e6); // 25% of $1,100
        loan.makeRepayment(275 * 1e6);
        vm.stopPrank();
        
        (uint256 timeProgress, uint256 repaymentProgress) = loan.getRepaymentHealth();
        
        // Should show roughly 50% time progress and 25% repayment progress
        assertApproxEqAbs(timeProgress, 50, 5); // Within 5% tolerance
        assertApproxEqAbs(repaymentProgress, 25, 1); // Within 1% tolerance
    }
    
    function testNFTMetadata() public {
        _fundLoanCompletely();
        
        // Test that URI returns valid metadata
        string memory tokenURI = loan.uri(1);
        assertTrue(bytes(tokenURI).length > 0);
        
        // Should contain base64 encoded JSON
        assertTrue(_contains(tokenURI, "data:application/json;base64,"));
    }
    
    function testGetSupporterTokenDetails() public {
        // Supporter1 makes multiple contributions
        vm.startPrank(supporter1);
        usdc.approve(address(loan), 600 * 1e6);
        loan.supportLoan(200 * 1e6);
        loan.supportLoan(400 * 1e6);
        vm.stopPrank();
        
        // Complete funding
        vm.startPrank(supporter2);
        usdc.approve(address(loan), 400 * 1e6);
        loan.supportLoan(400 * 1e6);
        vm.stopPrank();
        
        // Get supporter1's token details
        (
            uint256[] memory tokenIds,
            uint256[] memory contributionAmounts,
            uint256[] memory claimedAmounts,
            uint256[] memory claimableAmounts
        ) = loan.getSupporterTokenDetails(supporter1);
        
        assertEq(tokenIds.length, 2);
        assertEq(contributionAmounts[0], 200 * 1e6);
        assertEq(contributionAmounts[1], 400 * 1e6);
        assertEq(claimedAmounts[0], 0);
        assertEq(claimedAmounts[1], 0);
        assertEq(claimableAmounts[0], 0); // No repayments yet
        assertEq(claimableAmounts[1], 0);
    }
    
    function testIncrementalClaimingScenario() public {
        // Scenario: Borrower makes multiple partial repayments, 
        // supporters claim returns incrementally
        _fundLoanCompletely();
        
        // First repayment: 30% ($330)
        vm.startPrank(borrower);
        usdc.approve(address(loan), 330 * 1e6);
        loan.makeRepayment(330 * 1e6);
        vm.stopPrank();
        
        // Supporter1 claims first batch
        vm.startPrank(supporter1);
        uint256 firstClaim = loan.getClaimableAmount(1);
        loan.claimReturns(1);
        vm.stopPrank();
        
        // Second repayment: 40% more ($440)
        vm.startPrank(borrower);
        usdc.approve(address(loan), 440 * 1e6);
        loan.makeRepayment(440 * 1e6);
        vm.stopPrank();
        
        // Supporter1 claims second batch
        vm.startPrank(supporter1);
        uint256 secondClaim = loan.getClaimableAmount(1);
        loan.claimReturns(1);
        vm.stopPrank();
        
        // Final repayment: remaining 30% ($330)
        vm.startPrank(borrower);
        usdc.approve(address(loan), 330 * 1e6);
        loan.makeRepayment(330 * 1e6);
        vm.stopPrank();
        
        // Supporter1 claims final batch
        vm.startPrank(supporter1);
        uint256 finalClaim = loan.getClaimableAmount(1);
        loan.claimReturns(1);
        vm.stopPrank();
        
        // Total claimed should equal supporter1's proportional share
        // Supporter1 contributed $400 out of $1000, so should get 40% of $1100 = $440
        assertEq(firstClaim + secondClaim + finalClaim, 440 * 1e6);
    }
    
    // Helper functions
    function _fundLoanCompletely() internal {
        vm.startPrank(supporter1);
        usdc.approve(address(loan), 400 * 1e6);
        loan.supportLoan(400 * 1e6);
        vm.stopPrank();
        
        vm.startPrank(supporter2);
        usdc.approve(address(loan), 300 * 1e6);
        loan.supportLoan(300 * 1e6);
        vm.stopPrank();
        
        vm.startPrank(supporter3);
        usdc.approve(address(loan), 300 * 1e6);
        loan.supportLoan(300 * 1e6);
        vm.stopPrank();
    }
    
    function _contains(string memory _base, string memory _value) internal pure returns (bool) {
        bytes memory baseBytes = bytes(_base);
        bytes memory valueBytes = bytes(_value);
        
        if (valueBytes.length > baseBytes.length) return false;
        
        for (uint i = 0; i <= baseBytes.length - valueBytes.length; i++) {
            bool found = true;
            for (uint j = 0; j < valueBytes.length; j++) {
                if (baseBytes[i + j] != valueBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }
}

// Helper contract for testing with mock USDC
contract TestableLndyLoan is LndyLoan {
    IERC20 public testUSDC;
    
    constructor(
        uint256 _loanAmount,
        uint256 _thankYouAmount,
        uint256 _targetRepaymentDate,
        uint256 _fundingPeriod,
        string memory _description,
        string memory _baseImageURI,
        address _borrower,
        address _testUSDC
    ) LndyLoan(
        _loanAmount,
        _thankYouAmount,
        _targetRepaymentDate,
        _fundingPeriod,
        _description,
        _baseImageURI,
        _borrower
    ) {
        testUSDC = IERC20(_testUSDC);
    }
    
    // Override USDC-related functions to use test USDC
    function supportLoan(uint256 _amount) external override nonReentrant {
        require(block.timestamp < fundingDeadline, "Funding period has ended");
        require(!isActive, "Loan is already fully funded");
        require(_amount > 0, "Amount must be greater than 0");
        require(totalFunded + _amount <= loanAmount, "Funding amount exceeds loan requirement");
        
        // Transfer USDC from supporter to this contract
        require(testUSDC.transferFrom(msg.sender, address(this), _amount), "USDC transfer failed");
        
        // Mint a unique NFT token for this contribution
        uint256 tokenId = nextTokenId++;
        _mint(msg.sender, tokenId, 1, "");
        
        // Store token metadata
        tokenValues[tokenId] = _amount;
        tokenSupporter[tokenId] = msg.sender;
        supporterTokens[msg.sender].push(tokenId);
        
        totalFunded += _amount;
        
        emit LoanSupported(msg.sender, tokenId, _amount);
        
        // If loan is fully funded, activate it and send funds to borrower
        if (totalFunded == loanAmount) {
            isActive = true;
            
            // Transfer the full loan amount to the borrower
            require(testUSDC.transfer(borrower, loanAmount), "Transfer to borrower failed");
            
            emit LoanActivated(totalFunded);
        }
    }
    
    function makeRepayment(uint256 _amount) external override nonReentrant {
        require(msg.sender == borrower, "Only borrower can make repayments");
        require(isActive, "Loan is not active");
        require(!isFullyRepaid, "Loan is already fully repaid");
        require(_amount > 0, "Repayment amount must be greater than 0");
        require(actualRepaidAmount + _amount <= totalRepaidAmount, "Repayment exceeds total amount due");
        
        // Transfer USDC from borrower to this contract
        require(testUSDC.transferFrom(msg.sender, address(this), _amount), "USDC transfer failed");
        
        actualRepaidAmount += _amount;
        
        if (actualRepaidAmount == totalRepaidAmount) {
            isFullyRepaid = true;
        }
        
        emit RepaymentMade(_amount, actualRepaidAmount);
    }
    
    function claimReturns(uint256 tokenId) external override nonReentrant {
        require(isActive, "Loan is not active yet");
        require(msg.sender == ownerOf(tokenId), "You don't own this token");
        require(balanceOf(msg.sender, tokenId) > 0, "No tokens to claim for");
        
        uint256 contributionAmount = tokenValues[tokenId];
        uint256 alreadyClaimed = tokenClaimedAmounts[tokenId];
        
        // Calculate total earned so far (proportional to repayments made)
        uint256 totalEarned = (contributionAmount * actualRepaidAmount) / loanAmount;
        
        // Calculate how much can be claimed now
        require(totalEarned > alreadyClaimed, "No new returns available to claim");
        uint256 claimableAmount = totalEarned - alreadyClaimed;
        
        // Update claimed amount
        tokenClaimedAmounts[tokenId] += claimableAmount;
        
        // Transfer claimable returns to the supporter
        require(testUSDC.transfer(msg.sender, claimableAmount), "Return transfer failed");
        
        emit ReturnsClaimed(msg.sender, tokenId, claimableAmount);
    }
    
    function withdrawFunds(uint256 tokenId) external override nonReentrant {
        require(block.timestamp > fundingDeadline, "Funding period has not ended");
        require(!isActive, "Loan is already active");
        require(msg.sender == ownerOf(tokenId), "You don't own this token");
        require(balanceOf(msg.sender, tokenId) > 0, "No tokens to withdraw for");
        require(tokenClaimedAmounts[tokenId] == 0, "Funds already withdrawn for this token");
        
        uint256 contributionAmount = tokenValues[tokenId];
        
        // Mark as withdrawn (use claimed amount to prevent double withdrawal)
        tokenClaimedAmounts[tokenId] = contributionAmount;
        
        // Update total funded
        totalFunded -= contributionAmount;
        
        // Transfer the contribution back to the supporter
        require(testUSDC.transfer(msg.sender, contributionAmount), "Withdrawal transfer failed");
    }
} 