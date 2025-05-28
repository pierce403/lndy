import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { readContract } from "thirdweb";
import { Loan } from "../types/types";
import { getLauncherContract, getLoanContract } from "../lib/client";

export const useInvestments = () => {
  const account = useActiveAccount();
  const address = account?.address;
  const [investments, setInvestments] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const launcherAddress = import.meta.env.VITE_LAUNCHER_CONTRACT_ADDRESS;

  useEffect(() => {
    const fetchInvestments = async () => {
      if (!address || !launcherAddress) {
        setIsLoading(false);
        return;
      }

      try {
        const launcherContract = getLauncherContract();
        
        const allLoanAddresses = await readContract({
          contract: launcherContract,
          method: "function getAllLoans() view returns (address[])",
          params: [],
        });
        
        if (!allLoanAddresses || allLoanAddresses.length === 0) {
          setInvestments([]);
          setIsLoading(false);
          return;
        }

        const investmentPromises = allLoanAddresses.map(async (loanAddress: string) => {
          try {
            const loanContract = getLoanContract(loanAddress);
            
            const balance = await readContract({
              contract: loanContract,
              method: "function balanceOf(address account, uint256 id) view returns (uint256)",
              params: [address, BigInt(1)],
            });
            
            if (balance && balance > 0) {
              const loanDetails = await readContract({
                contract: loanContract,
                method: "function getLoanDetails() view returns (uint256 _loanAmount, uint256 _interestRate, uint256 _duration, uint256 _fundingDeadline, uint256 _repaymentDate, string _description, string _imageURI, address _borrower, uint256 _totalFunded, bool _isActive, bool _isRepaid)",
                params: [],
              });
              
              return {
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
            }
            
            return null;
          } catch (err) {
            console.error(`Error checking investment for loan ${loanAddress}:`, err);
            return null;
          }
        });

        const userInvestments = await Promise.all(investmentPromises);
        setInvestments(userInvestments.filter(Boolean) as Loan[]);
      } catch (error) {
        console.error("Error fetching investments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestments();
  }, [address, launcherAddress]);

  return { investments, isLoading };
};
