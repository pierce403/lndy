// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/LndyLauncher.sol";
import "../src/LndyLoan.sol";

contract LndyLauncherTest is Test {
    LndyLauncher public launcher;
    
    // Test addresses
    address public borrower1 = makeAddr("borrower1");
    address public borrower2 = makeAddr("borrower2");
    
    // Loan parameters
    uint256 public constant LOAN_AMOUNT = 1000 * 1e6; // $1,000 USDC
    uint256 public constant THANK_YOU_AMOUNT = 1000; // 10% in basis points
    uint256 public constant FUNDING_PERIOD = 7 days;
    uint256 public TARGET_REPAYMENT_DATE; // Not constant, set in setUp
    string public constant DESCRIPTION = "Starting a coffee shop in downtown";
    string public constant BASE_IMAGE_URI = "ipfs://QmExampleHash";

    function setUp() public {
        // Set the target repayment date
        TARGET_REPAYMENT_DATE = block.timestamp + 30 days;
        launcher = new LndyLauncher();
    }
    
    function testCreateLoan() public {
        vm.startPrank(borrower1);
        
        address loanAddress = launcher.createLoan(
            LOAN_AMOUNT,
            THANK_YOU_AMOUNT,
            TARGET_REPAYMENT_DATE,
            FUNDING_PERIOD,
            DESCRIPTION,
            BASE_IMAGE_URI
        );
        
        vm.stopPrank();
        
        // Verify loan contract was created
        assertTrue(loanAddress != address(0));
        
        // Verify loan details
        LndyLoan loan = LndyLoan(loanAddress);
        (
            uint256 _loanAmount,
            uint256 _thankYouAmount,
            uint256 _targetRepaymentDate,
            ,
            string memory _description,
            string memory _baseImageURI,
            address _borrower,
            ,,,,
        ) = loan.getLoanDetails();
        
        assertEq(_loanAmount, LOAN_AMOUNT);
        assertEq(_thankYouAmount, THANK_YOU_AMOUNT);
        assertEq(_targetRepaymentDate, TARGET_REPAYMENT_DATE);
        assertEq(_description, DESCRIPTION);
        assertEq(_baseImageURI, BASE_IMAGE_URI);
        assertEq(_borrower, borrower1);
    }
    
    function testGetBorrowerLoans() public {
        // Borrower1 creates multiple loans
        vm.startPrank(borrower1);
        address loan1 = launcher.createLoan(
            LOAN_AMOUNT,
            THANK_YOU_AMOUNT,
            TARGET_REPAYMENT_DATE,
            FUNDING_PERIOD,
            "First loan",
            BASE_IMAGE_URI
        );
        
        address loan2 = launcher.createLoan(
            500 * 1e6,
            THANK_YOU_AMOUNT,
            TARGET_REPAYMENT_DATE + 5 days,
            FUNDING_PERIOD,
            "Second loan",
            BASE_IMAGE_URI
        );
        vm.stopPrank();
        
        // Get borrower's loans
        address[] memory borrower1Loans = launcher.getBorrowerLoans(borrower1);
        
        assertEq(borrower1Loans.length, 2);
        assertEq(borrower1Loans[0], loan1);
        assertEq(borrower1Loans[1], loan2);
        
        // Borrower2 should have no loans
        address[] memory borrower2Loans = launcher.getBorrowerLoans(borrower2);
        assertEq(borrower2Loans.length, 0);
    }
    
    function testGetAllLoans() public {
        // Initially no loans
        address[] memory allLoans = launcher.getAllLoans();
        assertEq(allLoans.length, 0);
        
        // Create some loans
        vm.startPrank(borrower1);
        address loan1 = launcher.createLoan(
            LOAN_AMOUNT,
            THANK_YOU_AMOUNT,
            TARGET_REPAYMENT_DATE,
            FUNDING_PERIOD,
            "Loan 1",
            BASE_IMAGE_URI
        );
        vm.stopPrank();
        
        vm.startPrank(borrower2);
        address loan2 = launcher.createLoan(
            500 * 1e6,
            THANK_YOU_AMOUNT,
            TARGET_REPAYMENT_DATE,
            FUNDING_PERIOD,
            "Loan 2",
            BASE_IMAGE_URI
        );
        vm.stopPrank();
        
        // Check all loans are returned
        allLoans = launcher.getAllLoans();
        assertEq(allLoans.length, 2);
        assertEq(allLoans[0], loan1);
        assertEq(allLoans[1], loan2);
    }
    
    function testCannotCreateLoanWithZeroAmount() public {
        vm.startPrank(borrower1);
        
        vm.expectRevert("Loan amount must be greater than 0");
        launcher.createLoan(
            0,
            THANK_YOU_AMOUNT,
            TARGET_REPAYMENT_DATE,
            FUNDING_PERIOD,
            DESCRIPTION,
            BASE_IMAGE_URI
        );
        
        vm.stopPrank();
    }
} 