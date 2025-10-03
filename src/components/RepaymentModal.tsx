import { useState, useEffect, useMemo } from "react";
import { useWallet } from "../hooks/useWallet";
import { prepareContractCall, getContract, readContract } from "thirdweb";
import { getLoanContract } from "../lib/client";
import { client } from "../lib/client";
import { base } from "thirdweb/chains";
import Modal from "./Modal";
import { Loan } from "../types/types";
import { useTransactionExecutor } from "../hooks/useTransactionExecutor";
import { notifyLoanRepaid, notifyContributorsRepayment } from "../utils/notifications";

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan;
  onSuccess: (transactionHash: string, amount: string) => void;
}

const RepaymentModal = ({ isOpen, onClose, loan, onSuccess }: RepaymentModalProps) => {
  const { address } = useWallet();
  const { executeTransaction, isPending } = useTransactionExecutor();
  
  const [repaymentAmount, setRepaymentAmount] = useState<number>(0);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [hasApproval, setHasApproval] = useState<boolean>(false);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
  const [actualRepaidAmount, setActualRepaidAmount] = useState<number>(0);
  const [totalRepaidAmount, setTotalRepaidAmount] = useState<number>(0);
  const [contributors, setContributors] = useState<string[]>([]);
  
  // Calculate repayment details
  const remainingAmount = (totalRepaidAmount - actualRepaidAmount);
  const repaidPercentage = totalRepaidAmount > 0 ? (actualRepaidAmount / totalRepaidAmount) * 100 : 0;
  
  // USDC contract on Base
  const usdcContract = useMemo(
    () =>
      getContract({
        client,
        chain: base,
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
      }),
    [],
  );

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const maxAmount = Math.min(remainingAmount, usdcBalance);
      setRepaymentAmount(Math.min(remainingAmount, maxAmount));
      setHasApproval(false);
    }
  }, [isOpen, remainingAmount, usdcBalance]);

  // Fetch USDC balance and repayment details when modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (!address || !isOpen) {
        setIsLoadingBalance(false);
        return;
      }

      try {
        setIsLoadingBalance(true);
        
        // Fetch USDC balance
        const balance = await readContract({
          contract: usdcContract,
          method: "function balanceOf(address account) view returns (uint256)",
          params: [address],
        });
        
        const balanceInUSDC = Number(balance) / 1e6;
        setUsdcBalance(balanceInUSDC);
        
        // Fetch current repayment status
        const loanContract = getLoanContract(loan.address);
        const loanDetails = await readContract({
          contract: loanContract,
          method: "function getLoanDetails() view returns (uint256 _loanAmount, uint256 _thankYouAmount, uint256 _targetRepaymentDate, uint256 _fundingDeadline, string _title, string _description, string _baseImageURI, address _borrower, uint256 _totalFunded, uint256 _totalRepaidAmount, uint256 _actualRepaidAmount, bool _isActive, bool _isFullyRepaid)",
          params: [],
        });
        
        setTotalRepaidAmount(Number(loanDetails[9]) / 1e6); // totalRepaidAmount
        setActualRepaidAmount(Number(loanDetails[10]) / 1e6); // actualRepaidAmount
        
        // Fetch contributors from the loan contract
        console.log("👥 RepaymentModal: Fetching contributors for loan:", loan.address);
        
        // Get the next token ID to determine how many tokens exist
        const nextTokenId = await readContract({
          contract: loanContract,
          method: "function nextTokenId() view returns (uint256)",
          params: [],
        });
        
        // Fetch all contributors by getting token supporters
        const contributorsList: string[] = [];
        for (let i = 1; i < Number(nextTokenId); i++) {
          try {
            const supporter = await readContract({
              contract: loanContract,
              method: "function tokenSupporter(uint256 tokenId) view returns (address)",
              params: [BigInt(i)],
            });
            if (supporter && !contributorsList.includes(supporter)) {
              contributorsList.push(supporter);
            }
          } catch (error) {
            console.warn(`⚠️ RepaymentModal: Failed to fetch supporter for token ${i}:`, error);
          }
        }
        
        console.log("✅ RepaymentModal: Found contributors:", contributorsList);
        setContributors(contributorsList);
        
      } catch (error) {
        console.error("❌ RepaymentModal: Failed to fetch data:", error);
        setUsdcBalance(0);
        setContributors([]);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchData();
  }, [address, isOpen, loan.address, usdcContract]);

  const handlePercentageClick = (percentage: number) => {
    const maxAmount = Math.min(remainingAmount, usdcBalance);
    const amount = Math.min((remainingAmount * percentage) / 100, maxAmount);
    setRepaymentAmount(Math.round(amount * 100) / 100);
  };

  const handleApproval = async () => {
    if (!address) return;
    
    try {
      setIsApproving(true);
      console.log("🔐 RepaymentModal: Starting USDC approval...");
      
      const approvalAmount = BigInt(Math.ceil(repaymentAmount) * 1e6);
      
      const approvalTransaction = prepareContractCall({
        contract: usdcContract,
        method: "function approve(address spender, uint256 amount) returns (bool)",
        params: [loan.address, approvalAmount]
      });
      
      executeTransaction(approvalTransaction, {
        onSuccess: (result) => {
          console.log("✅ RepaymentModal: USDC approval successful:", result.transactionHash);
          setHasApproval(true);
        },
        onError: (error) => {
          console.error("❌ RepaymentModal: USDC approval failed:", error);
          alert("Failed to approve USDC spending. Please try again.");
        }
      });
    } catch (error) {
      console.error("💥 RepaymentModal: Approval error:", error);
      alert("Failed to approve USDC spending. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRepayment = async () => {
    if (!address || !hasApproval) return;
    
    try {
      console.log("🚀 RepaymentModal: Starting repayment transaction...");
      const repayAmount = BigInt(Math.floor(repaymentAmount * 1e6));
      
      const loanContract = getLoanContract(loan.address);
      const transaction = prepareContractCall({
        contract: loanContract,
        method: "function makeRepayment(uint256 _amount)",
        params: [repayAmount]
      });
      
      executeTransaction(transaction, {
        onSuccess: (result) => {
          console.log("🎉 RepaymentModal: Repayment successful:", result.transactionHash);
          
          // Send notifications for loan repayment
          if (address) {
            const isPartial = repaymentAmount < remainingAmount;
            const repaymentData = {
              loanId: loan.address,
              borrowerAddress: loan.borrower,
              amount: `${repaymentAmount} USDC`,
              loanTitle: loan.title || 'Untitled Loan',
              isPartial: isPartial,
            };
            
            // Notify the borrower about their repayment
            notifyLoanRepaid(repaymentData).catch(error => 
              console.error("❌ RepaymentModal: Failed to send repayment notification:", error)
            );
            
            // Notify all contributors about the repayment
            contributors.forEach(contributorAddress => {
              notifyContributorsRepayment({
                ...repaymentData,
                contributorAddress: contributorAddress,
              }).catch(error => 
                console.error("❌ RepaymentModal: Failed to send contributor notification:", error)
              );
            });
          }
          
          onSuccess(result.transactionHash, `${repaymentAmount} USDC`);
          onClose();
        },
        onError: (error) => {
          console.error("❌ RepaymentModal: Repayment failed:", error);
          alert(`Failed to make repayment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    } catch (error) {
      console.error("💥 RepaymentModal: Repayment error:", error);
      alert("Failed to make repayment. Please try again.");
    }
  };

  const canProceed = repaymentAmount > 0 && repaymentAmount <= remainingAmount && repaymentAmount <= usdcBalance && address;

  if (!address) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💳 Repay Your Loan">
      <div className="space-y-6">
        {/* Loan Status */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-indigo-800 dark:text-indigo-200 font-medium">Loan Status</span>
            <span className="text-sm text-indigo-600 dark:text-indigo-400">
              {repaidPercentage.toFixed(1)}% repaid
            </span>
          </div>
          <div className="w-full bg-indigo-200 dark:bg-indigo-800 rounded-full h-3 mb-2">
            <div 
              className="bg-indigo-600 dark:bg-indigo-500 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${repaidPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-indigo-700 dark:text-indigo-300">
            <span>Repaid: ${actualRepaidAmount.toLocaleString()}</span>
            <span>Total Due: ${totalRepaidAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* User's USDC Balance */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-800 dark:text-blue-200 font-medium">Your USDC Balance</span>
            {isLoadingBalance ? (
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </div>
            ) : (
              <span className="text-xl font-bold text-blue-900 dark:text-blue-100">
                ${usdcBalance.toLocaleString()} USDC
              </span>
            )}
          </div>
          {!isLoadingBalance && usdcBalance < remainingAmount && (
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
              ⚠️ You have ${usdcBalance.toLocaleString()} but need ${remainingAmount.toLocaleString()} for full repayment.
            </p>
          )}
        </div>

        {/* Amount Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Repayment amount (USDC)
          </label>
          
          {/* Percentage Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[25, 50, 75, 100].map(percentage => {
              const maxAmount = Math.min(remainingAmount, usdcBalance);
              const amount = Math.min((remainingAmount * percentage) / 100, maxAmount);
              const isDisabled = maxAmount <= 0;
              return (
                <button
                  key={percentage}
                  onClick={() => handlePercentageClick(percentage)}
                  disabled={isDisabled}
                  className={`px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {percentage === 100 ? 'FULL' : `${percentage}%`}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ${amount.toFixed(0)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Amount Input */}
          <div className="space-y-3">
            <input
              type="number"
              min="1"
              max={Math.min(remainingAmount, usdcBalance)}
              step="0.01"
              value={repaymentAmount}
              onChange={(e) => setRepaymentAmount(Math.min(parseFloat(e.target.value) || 0, Math.min(remainingAmount, usdcBalance)))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter repayment amount"
            />
            
            {/* Validation Messages */}
            {repaymentAmount > usdcBalance && (
              <p className="text-sm text-red-600 dark:text-red-400">
                ⚠️ Amount exceeds your USDC balance (${usdcBalance.toLocaleString()})
              </p>
            )}
            {repaymentAmount > remainingAmount && (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                ⚠️ Amount exceeds remaining balance (${remainingAmount.toLocaleString()})
              </p>
            )}
            
            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min="1"
                max={Math.min(remainingAmount, usdcBalance)}
                step="0.01"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>$1</span>
                <span>${Math.min(remainingAmount, usdcBalance).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!hasApproval ? (
            <button
              onClick={handleApproval}
              disabled={!canProceed || isApproving || isPending}
              className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                (!canProceed || isApproving || isPending) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isApproving || isPending ? "Approving USDC..." : `Approve ${repaymentAmount} USDC`}
            </button>
          ) : (
            <button
              onClick={handleRepayment}
              disabled={!canProceed || isPending}
              className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                (!canProceed || isPending) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isPending ? "Processing Repayment..." : `Repay ${repaymentAmount} USDC`}
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="mb-1">ℹ️ About repayments:</p>
          <p>• Partial repayments are allowed</p>
          <p>• Supporters can claim returns as you repay</p>
          <p>• Full repayment marks the loan as completed</p>
        </div>
      </div>
    </Modal>
  );
};

export default RepaymentModal; 