import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { getLoanContract } from "../lib/client";
import { Loan } from "../types/types";

interface LoanCardProps {
  loan: Loan;
}

const LoanCard = ({ loan }: LoanCardProps) => {
  const account = useActiveAccount();
  const address = account?.address;
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const progressPercentage = loan.loanAmount > 0 
    ? Number((loan.totalFunded * BigInt(100)) / loan.loanAmount)
    : 0;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatCurrency = (amount: bigint) => {
    return (Number(amount) / 1e18).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const handleFund = async () => {
    console.log("💰 LoanCard: Fund button clicked");
    console.log("🏦 LoanCard: Loan being funded:", {
      address: loan.address,
      description: loan.description,
      borrower: loan.borrower,
      loanAmount: Number(loan.loanAmount) / 1e18 + " ETH",
      totalFunded: Number(loan.totalFunded) / 1e18 + " ETH",
      progressPercentage: progressPercentage + "%"
    });
    console.log("👤 LoanCard: Current user address:", address);
    
    if (!address) {
      console.warn("⚠️ LoanCard: No wallet connected, showing alert");
      alert("Please connect your wallet first");
      return;
    }

    try {
      console.log("🚀 LoanCard: Starting loan funding process...");
      const fundAmount = BigInt(1e18); // 1 ETH equivalent
      console.log("💸 LoanCard: Funding amount:", Number(fundAmount) / 1e18, "ETH");
      
      console.log("🔗 LoanCard: Getting loan contract instance...");
      const contract = getLoanContract(loan.address);
      console.log("✅ LoanCard: Loan contract obtained:", contract);
      
      console.log("📝 LoanCard: Preparing funding transaction...");
      const transaction = prepareContractCall({
        contract,
        method: "function fundLoan(uint256 amount) payable",
        params: [fundAmount],
        value: fundAmount
      });
      
      console.log("🔗 LoanCard: Transaction prepared:", transaction);
      console.log("📤 LoanCard: Transaction parameters:", {
        contractAddress: loan.address,
        fundAmount: fundAmount.toString(),
        fundAmountETH: Number(fundAmount) / 1e18,
        value: fundAmount.toString()
      });
      
      console.log("🚀 LoanCard: Sending funding transaction...");
      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log("🎉 LoanCard: Funding transaction successful!");
          console.log("✅ LoanCard: Transaction result:", result);
          console.log("🔗 LoanCard: Transaction hash:", result.transactionHash);
          console.log("📊 LoanCard: Funding details:", {
            loanAddress: loan.address,
            funder: address,
            amountFunded: Number(fundAmount) / 1e18 + " ETH",
            previousFunding: Number(loan.totalFunded) / 1e18 + " ETH",
            timestamp: new Date().toISOString()
          });
          
          alert("Loan funded successfully!");
        },
        onError: (error) => {
          console.error("💥 LoanCard: Funding transaction failed!");
          console.error("❌ LoanCard: Transaction error:", error);
          console.error("🔍 LoanCard: Error details:", {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            loanAddress: loan.address,
            fundAmount: Number(fundAmount) / 1e18 + " ETH"
          });
          alert("Failed to fund loan. See console for details.");
        }
      });
    } catch (err) {
      console.error("💥 LoanCard: Critical error in funding process!");
      console.error("❌ LoanCard: Error details:", err);
      console.error("🔍 LoanCard: Error breakdown:", {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        loanAddress: loan.address,
        userAddress: address
      });
      alert("Failed to fund loan. See console for details.");
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* NFT Image */}
      {loan.imageURI && (
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={loan.imageURI}
            alt={loan.description}
            className="w-full h-48 object-cover"
            onError={(e) => {
              // Hide image if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 truncate">{loan.description}</h3>
            <p className="text-sm text-gray-500">By {loan.borrower.substring(0, 6)}...{loan.borrower.substring(38)}</p>
          </div>
          <div className={`px-2 py-1 text-xs font-medium rounded-full ${
            loan.isRepaid 
              ? "bg-green-100 text-green-800" 
              : loan.isActive 
                ? "bg-blue-100 text-blue-800" 
                : "bg-yellow-100 text-yellow-800"
          }`}>
            {loan.isRepaid ? "Repaid" : loan.isActive ? "Active" : "Funding"}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-medium">{formatCurrency(loan.loanAmount)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Interest Rate</span>
            <span className="font-medium">{loan.interestRate / 100}%</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Duration</span>
            <span className="font-medium">{Math.floor(loan.duration / 86400)} days</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Funding Deadline</span>
            <span className="font-medium">{formatDate(loan.fundingDeadline)}</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Funding Progress</span>
            <span className="font-medium">{formatCurrency(loan.totalFunded)} / {formatCurrency(loan.loanAmount)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {progressPercentage}% funded
          </div>
        </div>
      </div>
      
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
        {!loan.isActive && !loan.isRepaid && Math.floor(Date.now() / 1000) < loan.fundingDeadline ? (
          <button
            onClick={handleFund}
            disabled={isPending || !address}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isPending || !address ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isPending ? "Processing..." : "Fund This Loan"}
          </button>
        ) : loan.isActive && !loan.isRepaid ? (
          <div className="text-center text-sm text-gray-600">
            Loan is active and NFTs are now tradable
          </div>
        ) : loan.isRepaid ? (
          <div className="text-center text-sm text-gray-600">
            Loan has been repaid
          </div>
        ) : (
          <div className="text-center text-sm text-gray-600">
            Funding period has ended
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanCard;
