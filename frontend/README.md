# Ricardian Yield Frontend

A modern React web application for the Ricardian Yield platform, built with Next.js, TypeScript, and Tailwind CSS. Features a green and white color scheme with intuitive UX for property management, rent collection, expense tracking, yield distribution, and yield stacking.

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

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (green/white theme)
- **Web3**: wagmi + viem (Ethereum/Mantle connection)
- **Charts**: Recharts
- **UI Components**: Custom components with Radix UI primitives
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

Create a `.env.local` file:

```bash
# Contract Addresses (set after deployment)
NEXT_PUBLIC_SYSTEM_ADDRESS=
NEXT_PUBLIC_USDC_ADDRESS=

# WalletConnect (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Dashboard page
│   ├── property/          # Property overview
│   ├── rent/              # Rent deposit
│   ├── expenses/          # Expense management
│   ├── yield/             # Yield distribution
│   ├── stacking/          # Yield stacking
│   ├── capex/             # CapEx governance
│   └── analytics/         # Analytics & reports
├── components/
│   ├── layout/            # Header, Footer
│   ├── ui/                # Reusable UI components
│   ├── dashboard/         # Dashboard-specific components
│   └── charts/             # Chart components
├── hooks/                 # Custom React hooks
│   ├── useProperty.ts     # Property data hooks
│   ├── useYield.ts        # Yield hooks
│   └── useCashFlow.ts     # Cash flow hooks
├── lib/                   # Utilities
│   ├── contracts.ts       # Contract addresses & ABIs
│   └── utils.ts           # Helper functions
└── public/                # Static assets
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

The frontend uses placeholder ABIs and contract addresses. After deploying the smart contracts:

1. Update contract addresses in `lib/contracts.ts`
2. Import actual ABIs from compiled contracts
3. Update hooks in `hooks/` directory to use real contract functions

## Responsive Design

All pages are mobile-responsive using Tailwind's responsive utilities:
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Grid layouts adapt to screen size

## Next Steps

1. **Deploy Contracts**: Deploy smart contracts to Mantle testnet
2. **Update ABIs**: Import actual contract ABIs
3. **Connect Contracts**: Wire up all contract interactions
4. **Add Error Handling**: Improve error messages and recovery
5. **Testing**: Add unit and integration tests
6. **Optimization**: Performance optimization and code splitting

## License

MIT
