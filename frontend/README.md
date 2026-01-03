# Ricardian Yield Frontend

A modern React web application for the Ricardian Yield platform, built with Vite, React, TypeScript, and Tailwind CSS. Features a green and white color scheme with intuitive UX for property management, rent collection, expense tracking, yield distribution, and yield stacking.

## Features

- **Landing Page**: Hero section, features showcase, and call-to-action
- **Dashboard**: Overview with key metrics and quick actions
- **Property Management**: Detailed property view with financial breakdown
- **Rent Collection**: Deposit rent payments with transaction history
- **Expense Tracking**: Record and view operating expenses
- **Yield Distribution**: View and claim yield by period
- **Yield Stacking**: Monitor and configure automatic DeFi yield stacking
- **CapEx Governance**: Create and manage capital expenditure proposals
- **Analytics**: Charts and reports for cash flow and yield trends
- **Wallet Integration**: Connect to Mantle network via wagmi

## Tech Stack

- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS (green/white theme)
- **Web3**: wagmi + viem (Ethereum/Mantle connection)
- **Charts**: Recharts
- **UI Components**: Custom components with Material Design principles
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form
- **Notifications**: react-hot-toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

The `.env` file is already created with deployed contract addresses. If you need to customize:

1. Copy `.env.example` to `.env` (already done)
2. Update contract addresses if deploying new contracts
3. See `ENV_SETUP.md` for detailed documentation

**Important**: The `.env` file uses `VITE_` prefix for all variables (required by Vite).

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm run preview  # Preview production build
```

## Project Structure

```
frontend/
├── src/
│   ├── pages/              # React Router pages
│   │   ├── Home.tsx       # Landing page
│   │   ├── Dashboard.tsx  # Dashboard page
│   │   ├── Property.tsx   # Property overview
│   │   ├── Rent.tsx       # Rent deposit
│   │   ├── Expenses.tsx   # Expense management
│   │   ├── Yield.tsx      # Yield distribution
│   │   ├── Stacking.tsx   # Yield stacking
│   │   ├── CapEx.tsx      # CapEx governance
│   │   ├── Analytics.tsx  # Analytics & reports
│   │   └── DAO.tsx        # DAO governance
│   ├── components/
│   │   ├── layout/        # Header, Footer
│   │   ├── ui/            # Reusable UI components
│   │   └── charts/        # Chart components
│   ├── hooks/             # Custom React hooks
│   │   ├── useProperty.ts # Property data hooks
│   │   ├── useYield.ts    # Yield hooks
│   │   ├── useCashFlow.ts # Cash flow hooks
│   │   ├── useUSDC.ts     # USDC token hooks
│   │   └── useContractWrite.ts # Write operation hooks
│   ├── lib/               # Utilities
│   │   ├── contracts.ts   # Contract addresses & ABIs
│   │   ├── abis/          # Contract ABI JSON files
│   │   └── utils.ts       # Helper functions
│   ├── App.tsx            # Root component with routes
│   ├── main.tsx           # Entry point
│   └── providers.tsx      # Wagmi & React Query providers
├── public/                # Static assets
├── .env                   # Environment variables (gitignored)
├── .env.example           # Environment template
└── vite.config.ts         # Vite configuration
```

## Design System

### Colors

- **Primary Green**: `#10B981` (emerald-500)
- **Dark Green**: `#059669` (emerald-600)
- **Light Green**: `#D1FAE5` (emerald-100)
- **White**: `#FFFFFF`
- **Gray Scale**: Various shades for text and borders

### Typography

- **Headings**: Inter (via Geist Sans)
- **Body**: Inter
- **Monospace**: JetBrains Mono (for addresses)

## Contract Integration

The frontend is fully integrated with deployed smart contracts on Mantle Sepolia Testnet:

1. ✅ Contract addresses configured in `.env` and `lib/contracts.ts`
2. ✅ ABIs imported from compiled contracts in `lib/abis/`
3. ✅ Hooks in `hooks/` directory use real contract functions
4. ✅ Rent deposit functionality fully working
5. ⏳ Additional pages (Yield, Expenses, CapEx, DAO) ready for integration

See `CONTRACT_INTEGRATION.md` for detailed integration status.

## Responsive Design

All pages are mobile-responsive using Tailwind's responsive utilities:
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Grid layouts adapt to screen size

## Contract Deployment

Contracts are deployed on Mantle Sepolia Testnet. See `deployed-contracts.json` in the root directory for all addresses.

## Next Steps

1. ✅ **Deploy Contracts**: Contracts deployed to Mantle Sepolia testnet
2. ✅ **Update ABIs**: Contract ABIs imported and configured
3. ✅ **Connect Contracts**: Rent deposit fully integrated
4. ⏳ **Complete Integration**: Finish integration for Yield, Expenses, CapEx, DAO pages
5. ⏳ **Add Error Handling**: Improve error messages and recovery
6. ⏳ **Testing**: Add unit and integration tests
7. ⏳ **Optimization**: Performance optimization and code splitting

## License

MIT
