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
7. **Update this agents file** whenever you learn something interesting about the codebase, including what works and what doesn't work

## Important Notes

- This is a Farcaster MiniApp with embedded wallet support
- All transactions use USDC on Base network
- Notifications are sent via Farcaster SDK
- Smart contracts are thoroughly tested with Foundry

## Farcaster MiniApp Preview Images

### Required Image Assets
- **Open Graph Image**: `public/og-card.png` (1200×630 pixels)
  - Used for social media previews and link sharing
  - Referenced in `og:image` meta tag as `https://lndy.org/og-card.png`
- **Farcaster MiniApp Tile**: `public/miniapp-tile.png` (640×640 pixels)
  - Used for Farcaster app display and miniapp tiles
  - Referenced in `fc:miniapp` JSON as `imageUrl` and `splashImageUrl`
- **Favicon**: `public/lndy-favicon.svg` (SVG format)
  - Used for browser tabs and bookmarks
  - Should remain as SVG for crisp display at all sizes

### Meta Tag Configuration
The `index.html` file contains critical meta tags for Farcaster compliance:

```html
<!-- Open Graph -->
<meta property="og:image" content="https://lndy.org/og-card.png" />

<!-- Farcaster Mini App Embed -->
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://lndy.org/miniapp-tile.png","button":{"title":"Browse Loans","action":{"type":"launch_miniapp","name":"LNDY - Social Lending","url":"https://lndy.org","splashImageUrl":"https://lndy.org/miniapp-tile.png","splashBackgroundColor":"#111827"}}}' />
```

### Key Implementation Details
- **Absolute URLs Required**: All image references must use full `https://lndy.org/` URLs
- **PNG Format**: Preview images must be PNG (not SVG) for proper social media display
- **Exact Dimensions**: og-card.png must be 1200×630, miniapp-tile.png must be 640×640
- **JSON Validity**: The `fc:miniapp` content must remain valid JSON
- **Favicon Preservation**: Keep existing SVG favicon for browser compatibility

### File Management
- Always add new PNG files to git: `git add public/og-card.png public/miniapp-tile.png`
- Update both `og:image` and `fc:miniapp` when changing preview images
- Test image URLs are accessible at `https://lndy.org/` before deploying
