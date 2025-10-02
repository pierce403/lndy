import { useActiveAccount } from "thirdweb/react";
import { Loan } from "../types/types";
import { useState, useEffect } from "react";
import { readContract } from "thirdweb";
import { getLoanContract } from "../lib/client";
import { lookupFarcasterProfile, getFarcasterProfileUrl, FarcasterProfile } from "../utils/farcaster";
import Modal from "./Modal";
import FundingModal from "./FundingModal";
import RepaymentModal from "./RepaymentModal";
import IpfsImage from "./IpfsImage";

interface LoanCardProps {
  loan: Loan;
}

const LoanCard = ({ loan }: LoanCardProps) => {
  const account = useActiveAccount();
  const address = account?.address;
  const [showFundingModal, setShowFundingModal] = useState<boolean>(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState<boolean>(false);
  const [showFundingSuccessModal, setShowFundingSuccessModal] = useState<boolean>(false);
  const [showRepaymentSuccessModal, setShowRepaymentSuccessModal] = useState<boolean>(false);
  const [actualRepaidAmount, setActualRepaidAmount] = useState<number>(0);
  const [totalRepaidAmount, setTotalRepaidAmount] = useState<number>(0);
  const [farcasterProfile, setFarcasterProfile] = useState<FarcasterProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [fundingSuccessDetails, setFundingSuccessDetails] = useState<{
    transactionHash: string;
    amountFunded: string;
  } | null>(null);
  const [repaymentSuccessDetails, setRepaymentSuccessDetails] = useState<{
    transactionHash: string;
    amountRepaid: string;
  } | null>(null);

  // Fetch repayment data for active loans
  useEffect(() => {
    const fetchRepaymentData = async () => {
      if (!loan.isActive || loan.isRepaid) {
        return;
      }

      try {
        const loanContract = getLoanContract(loan.address);
        const loanDetails = await readContract({
          contract: loanContract,
          method: "function getLoanDetails() view returns (uint256 _loanAmount, uint256 _thankYouAmount, uint256 _targetRepaymentDate, uint256 _fundingDeadline, string _title, string _description, string _baseImageURI, address _borrower, uint256 _totalFunded, uint256 _totalRepaidAmount, uint256 _actualRepaidAmount, bool _isActive, bool _isFullyRepaid)",
          params: [],
        });
        
        setTotalRepaidAmount(Number(loanDetails[9]) / 1e6); // totalRepaidAmount
        setActualRepaidAmount(Number(loanDetails[10]) / 1e6); // actualRepaidAmount
        
      } catch (error) {
        console.error("❌ LoanCard: Failed to fetch repayment data:", error);
      }
    };

    fetchRepaymentData();
  }, [loan.address, loan.isActive, loan.isRepaid]);

  // Fetch Farcaster profile for borrower
  useEffect(() => {
    const fetchFarcasterProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const profile = await lookupFarcasterProfile(loan.borrower);
        setFarcasterProfile(profile);
      } catch (error) {
        console.error("❌ LoanCard: Failed to fetch Farcaster profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchFarcasterProfile();
  }, [loan.borrower]);

  const progressPercentage = loan.loanAmount > 0 
    ? Number((loan.totalFunded * BigInt(100)) / loan.loanAmount)
    : 0;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatCurrency = (amount: bigint) => {
    return (Number(amount) / 1e6).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  // Calculate total repayment amount (principal + thank you amount)
  const calculateTotalRepayment = () => {
    const principal = Number(loan.loanAmount) / 1e6;
    const thankYouAmount = (principal * loan.interestRate) / 10000;
    return principal + thankYouAmount;
  };

  // Calculate repayment health for active loans
  const calculateRepaymentHealth = () => {
    if (!loan.isActive || loan.isRepaid) return null;
    
    const now = Math.floor(Date.now() / 1000);
    const loanStartTime = loan.fundingDeadline; // Assuming loan starts when funding ends
    const totalDuration = loan.repaymentDate - loanStartTime;
    const timeElapsed = now - loanStartTime;
    const timeProgress = Math.max(0, Math.min(100, (timeElapsed / totalDuration) * 100));
    
    // Calculate actual repayment progress
    const repaymentProgress = totalRepaidAmount > 0 ? (actualRepaidAmount / totalRepaidAmount) * 100 : 0;
    
    // Health is good if repayment is keeping up with time
    // Yellow if behind, red if significantly behind
    let healthStatus = 'good';
    let healthColor = 'bg-green-500';
    
    if (repaymentProgress < timeProgress - 20) {
      healthStatus = 'behind';
      healthColor = 'bg-yellow-500';
    }
    if (repaymentProgress < timeProgress - 40) {
      healthStatus = 'concerning';
      healthColor = 'bg-red-500';
    }
    
    return {
      timeProgress,
      repaymentProgress: Math.round(repaymentProgress * 10) / 10, // Round to 1 decimal
      healthStatus,
      healthColor
    };
  };

  const repaymentHealth = calculateRepaymentHealth();

  const handleFundingSuccess = (transactionHash: string, amount: string) => {
    setFundingSuccessDetails({
      transactionHash,
      amountFunded: amount
    });
    setShowFundingSuccessModal(true);
  };

  const handleRepaymentSuccess = (transactionHash: string, amount: string) => {
    setRepaymentSuccessDetails({
      transactionHash,
      amountRepaid: amount
    });
    setShowRepaymentSuccessModal(true);
    
    // Refresh repayment data after successful repayment
    setTimeout(() => {
      window.location.reload(); // Simple refresh to update all data
    }, 2000);
  };

  // Check if current user is the borrower
  const isBorrower = address && address.toLowerCase() === loan.borrower.toLowerCase();

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      {/* NFT Image */}
      {loan.imageURI && (
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700">
          <IpfsImage
            src={loan.imageURI}
            alt={loan.description}
            className="w-full h-48 object-cover"
          />
        </div>
      )}
      
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">{loan.description}</h3>
            {/* Farcaster Profile Display */}
            {isLoadingProfile ? (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading profile...
              </div>
            ) : farcasterProfile ? (
              <div className="flex items-center space-x-2">
                {farcasterProfile.pfpUrl && (
                  <img 
                    src={farcasterProfile.pfpUrl} 
                    alt={farcasterProfile.displayName || farcasterProfile.username}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <a 
                  href={getFarcasterProfileUrl(farcasterProfile.username)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors font-medium"
                >
                  @{farcasterProfile.username}
                  {farcasterProfile.displayName && farcasterProfile.displayName !== farcasterProfile.username && (
                    <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                      ({farcasterProfile.displayName})
                    </span>
                  )}
                </a>
              </div>
            ) : (
              <a 
                href={`https://basescan.org/address/${loan.borrower}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
              >
                By {loan.borrower.substring(0, 6)}...{loan.borrower.substring(38)}
              </a>
            )}
          </div>
          <div className={`px-2 py-1 text-xs font-medium rounded-full ${
            loan.isRepaid 
              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" 
              : loan.isActive 
                ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" 
                : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
          }`}>
            {loan.isRepaid ? "Repaid" : loan.isActive ? "Active" : "Funding"}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Requesting</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(loan.loanAmount)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500 dark:text-gray-400">Will return</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${calculateTotalRepayment().toLocaleString()} 
              <span className="text-xs text-gray-400 ml-1">
                (includes ${((Number(loan.loanAmount) / 1e6 * loan.interestRate) / 10000).toLocaleString()} thank you)
              </span>
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500 dark:text-gray-400">Target repayment</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatDate(loan.repaymentDate)}</span>
          </div>
          {loan.isActive && !loan.isRepaid && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500 dark:text-gray-400">Funding deadline was</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatDate(loan.fundingDeadline)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500 dark:text-gray-400">NFT Collection</span>
            <a 
              href={`https://opensea.io/assets/base/${loan.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors text-xs"
            >
              View on OpenSea →
            </a>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Funding Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(loan.totalFunded)} / {formatCurrency(loan.loanAmount)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
            {progressPercentage}% funded
          </div>
        </div>

        {/* Repayment Health Indicator for Active Loans */}
        {repaymentHealth && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500 dark:text-gray-400">Repayment Health</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                repaymentHealth.healthStatus === 'good' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : repaymentHealth.healthStatus === 'behind'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {repaymentHealth.healthStatus === 'good' ? 'On Track' : 
                 repaymentHealth.healthStatus === 'behind' ? 'Behind Schedule' : 'Needs Attention'}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Time elapsed: {Math.round(repaymentHealth.timeProgress)}% • Repaid: {repaymentHealth.repaymentProgress}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div className="relative h-2 rounded-full">
                {/* Time progress bar */}
                <div 
                  className="absolute top-0 left-0 h-2 bg-gray-400 rounded-full" 
                  style={{ width: `${repaymentHealth.timeProgress}%` }}
                ></div>
                {/* Repayment progress bar */}
                <div 
                  className={`absolute top-0 left-0 h-2 rounded-full ${repaymentHealth.healthColor}`}
                  style={{ width: `${repaymentHealth.repaymentProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        {!loan.isActive && !loan.isRepaid && Math.floor(Date.now() / 1000) < loan.fundingDeadline ? (
          <button
            onClick={() => setShowFundingModal(true)}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-700 ${
              !address ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {address ? "Fund This Loan" : "Connect Wallet"}
          </button>
        ) : loan.isActive && !loan.isRepaid ? (
          <div>
            {isBorrower ? (
              <button
                onClick={() => setShowRepaymentModal(true)}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-700"
              >
                💳 Repay Loan
              </button>
            ) : (
              <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                <div className="font-medium text-green-600 dark:text-green-400">✓ Fully funded!</div>
                <div className="mt-1">NFTs are now tradable • Repayment in progress</div>
              </div>
            )}
          </div>
        ) : loan.isRepaid ? (
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            <div className="font-medium text-green-600 dark:text-green-400">✓ Successfully repaid!</div>
            <div className="mt-1">Thank you to all supporters</div>
          </div>
        ) : (
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            Funding period has ended
          </div>
        )}
      </div>

      {showFundingSuccessModal && (
        <Modal
          isOpen={showFundingSuccessModal}
          onClose={() => setShowFundingSuccessModal(false)}
          title="🎉 Funding Successful!"
        >
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Thank you for funding this loan! Your contribution has been recorded.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount Funded:</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{fundingSuccessDetails?.amountFunded}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Transaction:</p>
                <a 
                  href={`https://basescan.org/tx/${fundingSuccessDetails?.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-mono text-sm break-all"
                >
                  {fundingSuccessDetails?.transactionHash}
                </a>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={() => setShowFundingSuccessModal(false)}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showFundingModal && (
        <FundingModal
          isOpen={showFundingModal}
          onClose={() => setShowFundingModal(false)}
          loan={loan}
          onSuccess={handleFundingSuccess}
        />
      )}

      {showRepaymentSuccessModal && (
        <Modal
          isOpen={showRepaymentSuccessModal}
          onClose={() => setShowRepaymentSuccessModal(false)}
          title="🎉 Repayment Successful!"
        >
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Thank you for repaying this loan! Your repayment has been recorded.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount Repaid:</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{repaymentSuccessDetails?.amountRepaid}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Transaction:</p>
                <a 
                  href={`https://basescan.org/tx/${repaymentSuccessDetails?.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-mono text-sm break-all"
                >
                  {repaymentSuccessDetails?.transactionHash}
                </a>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={() => setShowRepaymentSuccessModal(false)}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showRepaymentModal && (
        <RepaymentModal
          isOpen={showRepaymentModal}
          onClose={() => setShowRepaymentModal(false)}
          loan={loan}
          onSuccess={handleRepaymentSuccess}
        />
      )}
    </div>
  );
};

export default LoanCard;

