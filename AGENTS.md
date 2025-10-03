# Agent Instructions for LNDY Project

## Development Workflow

### Git Workflow
- **ALWAYS commit and push changes after completing each task**
- Use descriptive commit messages following conventional commit format
- Include detailed descriptions of what was implemented
- Push to main branch after each significant change

### Commit Message Format
```
type: brief description

- Detailed bullet points of changes
- Include any new features or fixes
- Mention files created/modified
```

### Examples
```
feat: implement Farcaster MiniApp notification system

- Add comprehensive notification system for loan events
- Notify all users when new loans are created
- Notify loan creators when contributions are made
- Notify contributors when loans are repaid (partial or full)
- Integrate with Farcaster SDK for native notifications
- Add contributor fetching from smart contracts
- Update README with MiniApp notification documentation
- Include error handling to prevent notification failures from breaking core functionality
```

## Project Structure

### Frontend (React/TypeScript)
- Located in `/src/` directory
- Uses Vite, Tailwind CSS, and thirdweb
- Farcaster MiniApp integration with SDK

### Smart Contracts (Solidity)
- Located in `/contracts/` directory
- Uses Foundry for development and testing
- Deployed on Base network

### Key Components
- `CreateLoan.tsx` - Loan creation interface
- `FundingModal.tsx` - Loan contribution interface
- `RepaymentModal.tsx` - Loan repayment interface
- `notifications.ts` - Farcaster notification system

## Development Guidelines

1. **Always test changes** before committing
2. **Check for linting errors** and fix them
3. **Update documentation** when adding new features
4. **Use TypeScript** for type safety
5. **Follow existing code patterns** and conventions
6. **Commit and push immediately** after completing tasks

## Important Notes

- This is a Farcaster MiniApp with embedded wallet support
- All transactions use USDC on Base network
- Notifications are sent via Farcaster SDK
- Smart contracts are thoroughly tested with Foundry
