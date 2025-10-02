import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { readContract } from "thirdweb";
import { Investment } from "../types/types";
import { getLauncherContract, getLoanContract } from "../lib/client";

export const useInvestments = () => {
  const account = useActiveAccount();
  const address = account?.address;
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const launcherAddress = import.meta.env.VITE_LAUNCHER_CONTRACT_ADDRESS;

  useEffect(() => {
    const fetchInvestments = async () => {
      if (!address || !launcherAddress) {
        setIsLoading(false);
        return;
      }

      try {
        console.log("🔍 useInvestments: Fetching investments for:", address);
        
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

        const allInvestments: Investment[] = [];

        // Check each loan for user's NFT investments
        for (const loanAddress of allLoanAddresses) {
          try {
            const loanContract = getLoanContract(loanAddress);
            
            // Get loan details first
            const loanDetails = await readContract({
              contract: loanContract,
              method: "function getLoanDetails() view returns (uint256 _loanAmount, uint256 _thankYouAmount, uint256 _targetRepaymentDate, uint256 _fundingDeadline, string _title, string _description, string _baseImageURI, address _borrower, uint256 _totalFunded, uint256 _totalRepaidAmount, uint256 _actualRepaidAmount, bool _isActive, bool _isFullyRepaid)",
              params: [],
            });

            // Get user's token IDs for this loan
            const userTokens = await readContract({
              contract: loanContract,
              method: "function getSupporterTokens(address supporter) view returns (uint256[])",
              params: [address],
            });

            console.log(`📋 useInvestments: Found ${userTokens.length} tokens for loan ${loanAddress}`);

            // For each token the user owns, get detailed information
            for (const tokenId of userTokens) {
              try {
                const balance = await readContract({
                  contract: loanContract,
                  method: "function balanceOf(address account, uint256 id) view returns (uint256)",
                  params: [address, tokenId],
                });

                if (balance && balance > 0) {
                  // Get token value (contribution amount)
                  const tokenValue = await readContract({
                    contract: loanContract,
                    method: "function tokenValues(uint256 tokenId) view returns (uint256)",
                    params: [tokenId],
                  });

                  // Get claimed amount for this token
                  const claimedAmount = await readContract({
                    contract: loanContract,
                    method: "function tokenClaimedAmounts(uint256 tokenId) view returns (uint256)",
                    params: [tokenId],
                  });

                  // Calculate claimable amount
                  const contributionInUSDC = Number(tokenValue) / 1e6;
                  const claimedInUSDC = Number(claimedAmount) / 1e6;
                  const totalRepaidAmount = Number(loanDetails[8]) / 1e6;
                  const actualRepaidAmount = Number(loanDetails[9]) / 1e6;
                  const loanAmount = Number(loanDetails[0]) / 1e6;
                  
                  // Calculate how much this token has earned so far
                  const totalEarned = loanAmount > 0 ? (contributionInUSDC * actualRepaidAmount) / loanAmount : 0;
                  const claimableAmount = Math.max(0, totalEarned - claimedInUSDC);

                  const investment: Investment = {
                    loanAddress: loanAddress,
                    tokenId: Number(tokenId),
                    contributionAmount: contributionInUSDC,
                    claimedAmount: claimedInUSDC,
                    claimableAmount: claimableAmount,
                    loanDescription: loanDetails[4], // description
                    loanImageURI: loanDetails[5], // imageURI
                    borrower: loanDetails[6], // borrower
                    isLoanActive: loanDetails[10], // isActive
                    isLoanRepaid: loanDetails[11], // isFullyRepaid
                    totalRepaidAmount: totalRepaidAmount,
                    actualRepaidAmount: actualRepaidAmount,
                  };

                  allInvestments.push(investment);
                  console.log(`✅ useInvestments: Added investment for token ${tokenId}:`, investment);
                }
              } catch (tokenError) {
                console.error(`❌ useInvestments: Error processing token ${tokenId}:`, tokenError);
              }
            }
          } catch (loanError) {
            console.error(`❌ useInvestments: Error processing loan ${loanAddress}:`, loanError);
          }
        }

        // Sort investments: claimable first, then by contribution amount
        const sortedInvestments = allInvestments.sort((a, b) => {
          if (a.claimableAmount > 0 && b.claimableAmount === 0) return -1;
          if (a.claimableAmount === 0 && b.claimableAmount > 0) return 1;
          return b.contributionAmount - a.contributionAmount;
        });

        console.log("🎯 useInvestments: Final investments:", sortedInvestments);
        setInvestments(sortedInvestments);
      } catch (error) {
        console.error("❌ useInvestments: Error fetching investments:", error);
        setInvestments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestments();
  }, [address, launcherAddress]);

  return { investments, isLoading };
};
