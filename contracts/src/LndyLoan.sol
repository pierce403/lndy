// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LndyLoan
 * @dev ERC1155 contract representing a social loan funded by supporters using USDC.
 * Each unique token ID represents an individual contribution with a specific value.
 * Contributors receive NFTs that show their contribution amount on OpenSea.
 */
contract LndyLoan is ERC1155, Ownable, ReentrancyGuard {
    using Strings for uint256;
    
    // USDC contract address on Base mainnet
    IERC20 public constant USDC = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    
    // Loan details
    uint256 public loanAmount; // Amount requested in USDC (6 decimals)
    uint256 public thankYouAmount; // Additional amount to show appreciation in basis points
    uint256 public targetRepaymentDate; // When borrower plans to repay
    uint256 public fundingDeadline; // Deadline for funding
    string public title; // Short title for the loan (max 20 characters)
    string public description; // Description of the loan purpose (max 200 characters)
    string public baseImageURI; // Base IPFS URI for the loan NFT images
    address public borrower;
    uint256 public loanIndex; // Index of this loan in the LndyLauncher
    
    // Collection metadata for OpenSea
    string public name; // ERC-1155 collection name
    string public symbol; // ERC-1155 symbol
    
    // Loan state
    uint256 public totalFunded; // Total USDC funded
    uint256 public totalRepaidAmount; // Total amount to be repaid (principal + thank you)
    uint256 public actualRepaidAmount; // Amount actually repaid so far
    bool public isActive; // True when fully funded
    bool public isFullyRepaid; // True when completely repaid
    
    // Token tracking
    uint256 public nextTokenId = 1; // Next token ID to mint
    mapping(uint256 => uint256) public tokenValues; // tokenId => USDC value of this token
    mapping(uint256 => address) public tokenSupporter; // tokenId => supporter address
    mapping(uint256 => uint256) public tokenClaimedAmounts; // tokenId => amount already claimed
    mapping(address => uint256[]) public supporterTokens; // supporter => array of token IDs
    
    // Events
    event LoanCreated(address indexed borrower, uint256 loanAmount, uint256 thankYouAmount, uint256 targetRepaymentDate, string baseImageURI);
    event LoanSupported(address indexed supporter, uint256 indexed tokenId, uint256 amount);
    event LoanActivated(uint256 totalFunded);
    event RepaymentMade(uint256 amount, uint256 totalRepaid);
    event ReturnsClaimed(address indexed supporter, uint256 indexed tokenId, uint256 amount);
    
    /**
     * @dev Constructor to create a new social loan
     * @param _loanAmount Total USDC amount requested (with 6 decimals)
     * @param _thankYouAmount Thank you amount in basis points (e.g., 1000 = 10%)
     * @param _targetRepaymentDate When borrower plans to repay
     * @param _fundingPeriod Period in seconds during which the loan can be funded
     * @param _title Short title for the loan (max 20 characters)
     * @param _description Description of the loan purpose (max 200 characters)
     * @param _baseImageURI Base IPFS URI for the loan NFT images
     * @param _borrower Address of the borrower
     * @param _loanIndex Index of this loan in the LndyLauncher
     */
    constructor(
        uint256 _loanAmount,
        uint256 _thankYouAmount,
        uint256 _targetRepaymentDate,
        uint256 _fundingPeriod,
        string memory _title,
        string memory _description,
        string memory _baseImageURI,
        address _borrower,
        uint256 _loanIndex
    ) ERC1155("") Ownable(_borrower) {
        loanAmount = _loanAmount;
        thankYouAmount = _thankYouAmount;
        targetRepaymentDate = _targetRepaymentDate;
        fundingDeadline = block.timestamp + _fundingPeriod;
        title = _title;
        description = _description;
        baseImageURI = _baseImageURI;
        borrower = _borrower;
        loanIndex = _loanIndex;
        
        // Set collection name and symbol for OpenSea
        name = string(abi.encodePacked(_title, " - LNDY #", _loanIndex.toString()));
        symbol = "LNDY";
        
        // Calculate total repayment amount (principal + thank you)
        totalRepaidAmount = _loanAmount + (_loanAmount * _thankYouAmount) / 10000;
        
        emit LoanCreated(_borrower, _loanAmount, _thankYouAmount, _targetRepaymentDate, _baseImageURI);
    }
    
    /**
     * @dev Returns OpenSea-compatible metadata URI for a token
     * @param tokenId The token ID to get URI for
     * @return The metadata JSON URI for OpenSea
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId < nextTokenId, "Token ID does not exist");
        
        uint256 value = tokenValues[tokenId];
        uint256 claimedAmount = tokenClaimedAmounts[tokenId];
        
        // Determine token status
        string memory tokenStatus;
        if (!isActive && block.timestamp > fundingDeadline) {
            tokenStatus = claimedAmount > 0 ? "Funding Failed - Withdrawn" : "Funding Failed - Withdraw Available";
        } else if (!isActive) {
            tokenStatus = "Funding";
        } else if (isFullyRepaid) {
            tokenStatus = "Completed";
        } else {
            tokenStatus = "Active";
        }
        
        // Return simplified JSON metadata with new naming format
        return string(abi.encodePacked(
            'data:application/json,{"name":"', title, ' - Support Token #', tokenId.toString(),
            '","description":"', description, 
            '","image":"', baseImageURI,
            '","attributes":[{"trait_type":"Contribution Amount","value":"', (value / 1e6).toString(),
            '"},{"trait_type":"Status","value":"', tokenStatus, '"}]}'
        ));
    }
    
    /**
     * @dev Returns contract-level metadata for OpenSea collection
     * @return The collection metadata JSON URI
     */
    function contractURI() public view returns (string memory) {
        return string(abi.encodePacked(
            'data:application/json,{"name":"', name,
            '","description":"', description,
            '","image":"', baseImageURI,
            '","external_link":"https://lndy.app"}'
        ));
    }
    
    /**
     * @dev Support the loan with USDC
     * @param _amount Amount of USDC to contribute (with 6 decimals)
     */
    function supportLoan(uint256 _amount) external virtual nonReentrant {
        require(block.timestamp < fundingDeadline, "Funding period has ended");
        require(!isActive, "Loan is already fully funded");
        require(_amount > 0, "Amount must be greater than 0");
        require(totalFunded + _amount <= loanAmount, "Funding amount exceeds loan requirement");
        
        // Transfer USDC from supporter to this contract
        require(USDC.transferFrom(msg.sender, address(this), _amount), "USDC transfer failed");
        
        // Mint a unique NFT token for this contribution
        uint256 tokenId = nextTokenId++;
        _mint(msg.sender, tokenId, 1, ""); // Mint exactly 1 token
        
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
            require(USDC.transfer(borrower, loanAmount), "Transfer to borrower failed");
            
            emit LoanActivated(totalFunded);
        }
    }
    
    /**
     * @dev Make a repayment on the loan (callable by borrower)
     * @param _amount Amount to repay in USDC
     */
    function makeRepayment(uint256 _amount) external virtual nonReentrant {
        require(msg.sender == borrower, "Only borrower can make repayments");
        require(isActive, "Loan is not active");
        require(!isFullyRepaid, "Loan is already fully repaid");
        require(_amount > 0, "Repayment amount must be greater than 0");
        require(actualRepaidAmount + _amount <= totalRepaidAmount, "Repayment exceeds total amount due");
        
        // Transfer USDC from borrower to this contract
        require(USDC.transferFrom(msg.sender, address(this), _amount), "USDC transfer failed");
        
        actualRepaidAmount += _amount;
        
        if (actualRepaidAmount == totalRepaidAmount) {
            isFullyRepaid = true;
        }
        
        emit RepaymentMade(_amount, actualRepaidAmount);
    }
    
    /**
     * @dev Claim available returns at any time (doesn't need to wait for full repayment)
     * @param tokenId The token ID to claim returns for
     */
    function claimReturns(uint256 tokenId) external virtual nonReentrant {
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
        require(USDC.transfer(msg.sender, claimableAmount), "Return transfer failed");
        
        emit ReturnsClaimed(msg.sender, tokenId, claimableAmount);
    }
    
    /**
     * @dev Withdraw funds if loan is not activated before deadline
     * @param tokenId The token ID to withdraw funds for
     */
    function withdrawFunds(uint256 tokenId) external virtual nonReentrant {
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
        // Token remains as a keepsake showing they tried to support this loan
        require(USDC.transfer(msg.sender, contributionAmount), "Withdrawal transfer failed");
    }
    
    /**
     * @dev Get loan details
     */
    function getLoanDetails() external view returns (
        uint256 _loanAmount,
        uint256 _thankYouAmount,
        uint256 _targetRepaymentDate,
        uint256 _fundingDeadline,
        string memory _title,
        string memory _description,
        string memory _baseImageURI,
        address _borrower,
        uint256 _totalFunded,
        uint256 _totalRepaidAmount,
        uint256 _actualRepaidAmount,
        bool _isActive,
        bool _isFullyRepaid
    ) {
        return (
            loanAmount,
            thankYouAmount,
            targetRepaymentDate,
            fundingDeadline,
            title,
            description,
            baseImageURI,
            borrower,
            totalFunded,
            totalRepaidAmount,
            actualRepaidAmount,
            isActive,
            isFullyRepaid
        );
    }
    
    /**
     * @dev Get supporter's token IDs
     * @param supporter Address of the supporter
     * @return Array of token IDs owned by the supporter
     */
    function getSupporterTokens(address supporter) external view returns (uint256[] memory) {
        return supporterTokens[supporter];
    }
    
    /**
     * @dev Get repayment health (for frontend display)
     * @return timeProgress Percentage of time elapsed
     * @return repaymentProgress Percentage of amount repaid
     */
    function getRepaymentHealth() external view returns (uint256 timeProgress, uint256 repaymentProgress) {
        if (!isActive || isFullyRepaid) {
            return (0, 0);
        }
        
        uint256 currentTime = block.timestamp;
        uint256 loanStartTime = fundingDeadline; // Loan starts when funding ends
        uint256 totalDuration = targetRepaymentDate - loanStartTime;
        uint256 timeElapsed = currentTime > loanStartTime ? currentTime - loanStartTime : 0;
        
        timeProgress = totalDuration > 0 ? (timeElapsed * 100) / totalDuration : 0;
        timeProgress = timeProgress > 100 ? 100 : timeProgress;
        
        repaymentProgress = totalRepaidAmount > 0 ? (actualRepaidAmount * 100) / totalRepaidAmount : 0;
        
        return (timeProgress, repaymentProgress);
    }
    
    /**
     * @dev Check if tokens are transferable
     * Tokens are only transferable after the loan is activated
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override {
        super._update(from, to, ids, values);
        
        // If this is a mint or burn, allow it
        if (from == address(0) || to == address(0)) {
            return;
        }
        
        // Otherwise, only allow transfers if the loan is active
        require(isActive, "Tokens are not transferable until loan is activated");
    }
    
    // Helper functions
    function ownerOf(uint256 tokenId) public view returns (address) {
        return tokenSupporter[tokenId];
    }
    
    /**
     * @dev Get claimable amount for a token
     * @param tokenId The token ID to check
     * @return claimableAmount How much USDC can be claimed right now
     */
    function getClaimableAmount(uint256 tokenId) external view returns (uint256 claimableAmount) {
        require(tokenId > 0 && tokenId < nextTokenId, "Token ID does not exist");
        
        if (!isActive) {
            return 0;
        }
        
        uint256 contributionAmount = tokenValues[tokenId];
        uint256 alreadyClaimed = tokenClaimedAmounts[tokenId];
        
        // Calculate total earned so far
        uint256 totalEarned = (contributionAmount * actualRepaidAmount) / loanAmount;
        
        return totalEarned > alreadyClaimed ? totalEarned - alreadyClaimed : 0;
    }
    
    /**
     * @dev Get detailed token information for a supporter
     * @param supporter Address of the supporter
     * @return tokenIds Array of token IDs
     * @return contributionAmounts Array of contribution amounts for each token
     * @return claimedAmounts Array of amounts already claimed for each token
     * @return claimableAmounts Array of amounts currently claimable for each token
     */
    function getSupporterTokenDetails(address supporter) external view returns (
        uint256[] memory tokenIds,
        uint256[] memory contributionAmounts,
        uint256[] memory claimedAmounts,
        uint256[] memory claimableAmounts
    ) {
        uint256[] memory tokens = supporterTokens[supporter];
        uint256 length = tokens.length;
        
        tokenIds = new uint256[](length);
        contributionAmounts = new uint256[](length);
        claimedAmounts = new uint256[](length);
        claimableAmounts = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = tokens[i];
            tokenIds[i] = tokenId;
            contributionAmounts[i] = tokenValues[tokenId];
            claimedAmounts[i] = tokenClaimedAmounts[tokenId];
            
            // Calculate claimable amount
            if (isActive) {
                uint256 totalEarned = (contributionAmounts[i] * actualRepaidAmount) / loanAmount;
                claimableAmounts[i] = totalEarned > claimedAmounts[i] ? totalEarned - claimedAmounts[i] : 0;
            } else {
                claimableAmounts[i] = 0;
            }
        }
        
        return (tokenIds, contributionAmounts, claimedAmounts, claimableAmounts);
    }
}
