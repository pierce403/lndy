import { useState, useEffect } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, getContract } from "thirdweb";
import { getLoanContract } from "../lib/client";
import { client } from "../lib/client";
import { base } from "thirdweb/chains";
import Modal from "./Modal";
import { Loan } from "../types/types";

interface FundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan;
  onSuccess: (transactionHash: string, amount: string) => void;
}

const FundingModal = ({ isOpen, onClose, loan, onSuccess }: FundingModalProps) => {
  const account = useActiveAccount();
  const address = account?.address;
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  
  const [fundingAmount, setFundingAmount] = useState<number>(10);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [hasApproval, setHasApproval] = useState<boolean>(false);
  
  // Calculate remaining amount needed
  const remainingAmount = Number(loan.loanAmount - loan.totalFunded) / 1e6;
  const fundedPercentage = loan.loanAmount > 0 ? Number((loan.totalFunded * BigInt(100)) / loan.loanAmount) : 0;
  
  // USDC contract on Base
  const usdcContract = getContract({
    client,
    chain: base,
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFundingAmount(Math.min(10, remainingAmount));
      setHasApproval(false);
    }
  }, [isOpen, remainingAmount]);

  const handlePercentageClick = (percentage: number) => {
    const amount = Math.min((remainingAmount * percentage) / 100, remainingAmount);
    setFundingAmount(Math.round(amount * 100) / 100); // Round to 2 decimal places
  };

  const handleApproval = async () => {
    if (!address) return;
    
    try {
      setIsApproving(true);
      console.log("🔐 FundingModal: Starting USDC approval...");
      
      const approvalAmount = BigInt(Math.ceil(fundingAmount) * 1e6); // Convert to USDC units with some buffer
      
      const approvalTransaction = prepareContractCall({
        contract: usdcContract,
        method: "function approve(address spender, uint256 amount) returns (bool)",
        params: [loan.address, approvalAmount]
      });
      
      console.log("📝 FundingModal: Approving USDC spend:", {
        spender: loan.address,
        amount: approvalAmount.toString(),
        amountUSDC: fundingAmount
      });
      
      sendTransaction(approvalTransaction, {
        onSuccess: (result) => {
          console.log("✅ FundingModal: USDC approval successful:", result.transactionHash);
          setHasApproval(true);
        },
        onError: (error) => {
          console.error("❌ FundingModal: USDC approval failed:", error);
          alert("Failed to approve USDC spending. Please try again.");
        }
      });
    } catch (error) {
      console.error("💥 FundingModal: Approval error:", error);
      alert("Failed to approve USDC spending. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleFunding = async () => {
    if (!address || !hasApproval) return;
    
    try {
      console.log("🚀 FundingModal: Starting funding transaction...");
      const fundAmount = BigInt(Math.floor(fundingAmount * 1e6)); // Convert to USDC units
      
      const loanContract = getLoanContract(loan.address);
      const transaction = prepareContractCall({
        contract: loanContract,
        method: "function supportLoan(uint256 _amount)",
        params: [fundAmount]
      });
      
      console.log("📤 FundingModal: Funding parameters:", {
        loanAddress: loan.address,
        fundAmount: fundAmount.toString(),
        fundAmountUSDC: fundingAmount
      });
      
      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log("🎉 FundingModal: Funding successful:", result.transactionHash);
          onSuccess(result.transactionHash, `${fundingAmount} USDC`);
          onClose();
        },
        onError: (error) => {
          console.error("❌ FundingModal: Funding failed:", error);
          alert(`Failed to fund loan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    } catch (error) {
      console.error("💥 FundingModal: Funding error:", error);
      alert("Failed to fund loan. Please try again.");
    }
  };

  const canProceed = fundingAmount > 0 && fundingAmount <= remainingAmount && address;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💰 Fund This Loan">
      <div className="space-y-6">
        {/* Loan Progress */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-300">Funding Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${(Number(loan.totalFunded) / 1e6).toLocaleString()} / ${(Number(loan.loanAmount) / 1e6).toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
            <div 
              className="bg-indigo-600 dark:bg-indigo-500 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${fundedPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{fundedPercentage}% funded</span>
            <span>${remainingAmount.toLocaleString()} remaining</span>
          </div>
        </div>

        {/* Amount Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Choose funding amount (USDC)
          </label>
          
          {/* Percentage Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[10, 25, 50, 100].map(percentage => {
              const amount = Math.min((remainingAmount * percentage) / 100, remainingAmount);
              return (
                <button
                  key={percentage}
                  onClick={() => handlePercentageClick(percentage)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {percentage === 100 ? 'MAX' : `${percentage}%`}
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
              max={remainingAmount}
              step="0.01"
              value={fundingAmount}
              onChange={(e) => setFundingAmount(Math.min(parseFloat(e.target.value) || 0, remainingAmount))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter custom amount"
            />
            
            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min="1"
                max={remainingAmount}
                step="0.01"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>$1</span>
                <span>${remainingAmount.toFixed(0)}</span>
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
              {isApproving || isPending ? "Approving USDC..." : `Approve ${fundingAmount} USDC`}
            </button>
          ) : (
            <button
              onClick={handleFunding}
              disabled={!canProceed || isPending}
              className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                (!canProceed || isPending) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isPending ? "Funding..." : `Fund ${fundingAmount} USDC`}
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
          <p className="mb-1">ℹ️ Two transactions required:</p>
          <p>1. Approve USDC spending (one-time per loan)</p>
          <p>2. Fund the loan and receive your NFT</p>
        </div>
      </div>
    </Modal>
  );
};

export default FundingModal;

// Add slider styling
const sliderStyle = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #4f46e5;
    cursor: pointer;
    box-shadow: 0 0 2px 0 #555;
    transition: background .15s ease-in-out;
  }

  .slider::-webkit-slider-thumb:hover {
    background: #4338ca;
  }

  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #4f46e5;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 2px 0 #555;
    transition: background .15s ease-in-out;
  }

  .slider::-moz-range-thumb:hover {
    background: #4338ca;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = sliderStyle;
  document.head.appendChild(styleElement);
} 