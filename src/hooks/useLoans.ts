import { useState, useEffect } from "react";
import { readContract } from "thirdweb";
import { Loan } from "../types/types";
import { getLauncherContract, getLoanContract } from "../lib/client";
import { normalizeLoanDetails } from "../utils/sanitize";

export const useLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const launcherAddress = import.meta.env.VITE_LAUNCHER_CONTRACT_ADDRESS;

  // Function to fetch hidden loan addresses
  const fetchHiddenAddresses = async (): Promise<Set<string>> => {
    try {
      const response = await fetch('/hidden.txt');
      if (response.ok) {
        const text = await response.text();
        const addresses = text
          .split('\n')
          .map(addr => addr.trim().toLowerCase())
          .filter(addr => addr.length > 0);
        console.log("🔒 useLoans: Loaded hidden addresses:", addresses);
        return new Set(addresses);
      }
    } catch {
      console.log("ℹ️ useLoans: No hidden.txt file found or error reading it, continuing without filtering");
    }
    return new Set();
  };

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
        // Fetch hidden addresses first
        const hiddenAddresses = await fetchHiddenAddresses();
        
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

        // Filter out hidden addresses
        const visibleLoanAddresses = loanAddresses.filter((address: string) => {
          const isHidden = hiddenAddresses.has(address.toLowerCase());
          if (isHidden) {
            console.log("🔒 useLoans: Filtering out hidden loan:", address);
          }
          return !isHidden;
        });

        console.log("👁️ useLoans: Visible loan addresses after filtering:", visibleLoanAddresses);
        console.log("📊 useLoans: Visible loans count:", visibleLoanAddresses.length);

        if (visibleLoanAddresses.length === 0) {
          console.log("📭 useLoans: No visible loans after filtering, setting empty array");
          setLoans([]);
          setIsLoading(false);
          return;
        }

        console.log("🔄 useLoans: Starting to fetch details for each visible loan...");
        const loanDetailsPromises = visibleLoanAddresses.map(async (loanAddress: string, index: number) => {
          try {
            console.log(`🏦 useLoans: [${index + 1}/${visibleLoanAddresses.length}] Processing loan at address: ${loanAddress}`);
            const loanContract = getLoanContract(loanAddress);
            console.log(`🔗 useLoans: [${index + 1}] Created contract instance for loan ${loanAddress}`);
            
            console.log(`📞 useLoans: [${index + 1}] Calling getLoanDetails() for loan ${loanAddress}...`);
        const loanDetails = await readContract({
          contract: loanContract,
          method: "function getLoanDetails() view returns (uint256 _loanAmount, uint256 _thankYouAmount, uint256 _targetRepaymentDate, uint256 _fundingDeadline, string _title, string _description, string _baseImageURI, address _borrower, uint256 _totalFunded, uint256 _totalRepaidAmount, uint256 _actualRepaidAmount, bool _isActive, bool _isFullyRepaid)",
          params: [],
        });

        console.log(`📊 useLoans: [${index + 1}] Raw loan details for ${loanAddress}:`, loanDetails);

        const processedLoan = normalizeLoanDetails(loanDetails, loanAddress);

        console.log(`✅ useLoans: [${index + 1}] Processed loan data for ${loanAddress}:`, processedLoan);
            console.log(`💰 useLoans: [${index + 1}] Loan amount: ${Number(processedLoan.loanAmount) / 1e6} USDC`);
            console.log(`💝 useLoans: [${index + 1}] Thank you amount: ${processedLoan.interestRate / 100}%`);
            console.log(`⏱️ useLoans: [${index + 1}] Target repayment timeframe: ${processedLoan.duration / 86400} days`);
            console.log(`🖼️ useLoans: [${index + 1}] Image URI: ${processedLoan.imageURI}`);
            console.log(`👤 useLoans: [${index + 1}] Borrower: ${processedLoan.borrower}`);
            console.log(`💸 useLoans: [${index + 1}] Total funded: ${Number(processedLoan.totalFunded) / 1e6} USDC`);
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
