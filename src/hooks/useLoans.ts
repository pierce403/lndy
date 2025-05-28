import { useState, useEffect } from "react";
import { readContract } from "thirdweb";
import { Loan } from "../types/types";
import { getLauncherContract, getLoanContract } from "../lib/client";

export const useLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const launcherAddress = import.meta.env.VITE_LAUNCHER_CONTRACT_ADDRESS;

  useEffect(() => {
    const fetchLoanDetails = async () => {
      console.log("🔍 useLoans: Starting loan fetch process...");
      console.log("📍 useLoans: Launcher contract address:", launcherAddress);
      
      if (!launcherAddress) {
        console.error("❌ useLoans: Launcher contract address not configured");
        setError("Launcher contract address not configured");
        setIsLoading(false);
        return;
      }

      try {
        console.log("🔗 useLoans: Getting launcher contract instance...");
        const launcherContract = getLauncherContract();
        console.log("✅ useLoans: Launcher contract instance created:", launcherContract);
        
        console.log("📞 useLoans: Calling getAllLoans() on launcher contract...");
        // Read loan addresses from the launcher contract
        const loanAddresses = await readContract({
          contract: launcherContract,
          method: "function getAllLoans() view returns (address[])",
          params: [],
        });

        console.log("📋 useLoans: Received loan addresses:", loanAddresses);
        console.log("📊 useLoans: Total number of loans found:", loanAddresses?.length || 0);

        if (!loanAddresses || loanAddresses.length === 0) {
          console.log("📭 useLoans: No loans found, setting empty array");
          setIsLoading(false);
          return;
        }

        console.log("🔄 useLoans: Starting to fetch details for each loan...");
        const loanDetailsPromises = loanAddresses.map(async (loanAddress: string, index: number) => {
          try {
            console.log(`🏦 useLoans: [${index + 1}/${loanAddresses.length}] Processing loan at address: ${loanAddress}`);
            const loanContract = getLoanContract(loanAddress);
            console.log(`🔗 useLoans: [${index + 1}] Created contract instance for loan ${loanAddress}`);
            
            console.log(`📞 useLoans: [${index + 1}] Calling getLoanDetails() for loan ${loanAddress}...`);
            const loanDetails = await readContract({
              contract: loanContract,
              method: "function getLoanDetails() view returns (uint256 _loanAmount, uint256 _interestRate, uint256 _duration, uint256 _fundingDeadline, uint256 _repaymentDate, string _description, string _imageURI, address _borrower, uint256 _totalFunded, bool _isActive, bool _isRepaid)",
              params: [],
            });
            
            console.log(`📊 useLoans: [${index + 1}] Raw loan details for ${loanAddress}:`, loanDetails);
            
            const processedLoan = {
              address: loanAddress,
              loanAmount: loanDetails[0],
              interestRate: Number(loanDetails[1]),
              duration: Number(loanDetails[2]),
              fundingDeadline: Number(loanDetails[3]),
              repaymentDate: Number(loanDetails[4]),
              description: loanDetails[5],
              imageURI: loanDetails[6],
              borrower: loanDetails[7],
              totalFunded: loanDetails[8],
              isActive: loanDetails[9],
              isRepaid: loanDetails[10]
            };
            
            console.log(`✅ useLoans: [${index + 1}] Processed loan data for ${loanAddress}:`, processedLoan);
            console.log(`💰 useLoans: [${index + 1}] Loan amount: ${Number(processedLoan.loanAmount) / 1e18} (base units)`);
            console.log(`💝 useLoans: [${index + 1}] Thank you amount: ${processedLoan.interestRate / 100}%`);
            console.log(`⏱️ useLoans: [${index + 1}] Target repayment timeframe: ${processedLoan.duration / 86400} days`);
            console.log(`🖼️ useLoans: [${index + 1}] Image URI: ${processedLoan.imageURI}`);
            console.log(`👤 useLoans: [${index + 1}] Borrower: ${processedLoan.borrower}`);
            console.log(`💸 useLoans: [${index + 1}] Total funded: ${Number(processedLoan.totalFunded) / 1e18} (base units)`);
            console.log(`🔄 useLoans: [${index + 1}] Status - Active: ${processedLoan.isActive}, Repaid: ${processedLoan.isRepaid}`);
            
            return processedLoan;
          } catch (err) {
            console.error(`❌ useLoans: [${index + 1}] Error fetching details for loan ${loanAddress}:`, err);
            return null;
          }
        });

        console.log("⏳ useLoans: Waiting for all loan details to be fetched...");
        const loanDetails = await Promise.all(loanDetailsPromises);
        const validLoans = loanDetails.filter(Boolean) as Loan[];
        
        console.log("🎉 useLoans: All loan details fetched successfully!");
        console.log("📊 useLoans: Valid loans count:", validLoans.length);
        console.log("📋 useLoans: Final processed loans array:", validLoans);
        
        setLoans(validLoans);
      } catch (error) {
        console.error("💥 useLoans: Critical error during loan fetching:", error);
        console.error("🔍 useLoans: Error details:", {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
        });
        setError("Failed to fetch loans");
      } finally {
        console.log("🏁 useLoans: Fetch process completed, setting loading to false");
        setIsLoading(false);
      }
    };

    fetchLoanDetails();
  }, [launcherAddress]);

  console.log("📤 useLoans: Returning state - Loans:", loans.length, "Loading:", isLoading, "Error:", error);
  return { loans, isLoading, error };
};
