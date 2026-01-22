# Ricardian Yield 

**Tokenize real estate. Distribute real rental income. Automatically.**

Ricardian Yield is a blockchain system that lets you turn rental properties into digital tokens, so multiple people can own a piece of a property and earn real rental income from it. Think of it like buying shares of a rental property, except everything happens on the blockchain, and you get paid actual rent money—not promises or synthetic yields.

---

## What Problem Are We Solving?

Real estate investment has always been a great way to build wealth, but it's had some big problems:

- **High barriers to entry**: You need hundreds of thousands of dollars to buy a property
- **Lack of transparency**: You never really know if the property manager is being honest about expenses
- **Illiquidity**: Once you buy a property, it's hard to sell your share
- **Manual processes**: Rent collection, expense tracking, and profit distribution are all done manually and can be slow

Ricardian Yield solves all of these by putting everything on the blockchain. Now anyone can own a piece of a rental property, see exactly where the money goes, and get paid automatically when rent comes in.

---

## How It Works (The Simple Version)

Imagine you own an apartment building that rents for $3,000 per month. Instead of keeping all the income yourself, you can:

1. **Create shares** - Split the property into, say, 1,000,000 tokens
2. **Sell tokens** - Let other people buy these tokens (like buying stock)
3. **Collect rent** - Tenants pay rent in USDC (a stablecoin)
4. **Track expenses** - Record maintenance, repairs, and other costs on-chain
5. **Distribute profits** - Automatically split the leftover money among all token holders based on how many tokens they own

So if you own 10% of the tokens, you get 10% of the profits. It's that simple.

---

## The Full System Explained

### The Big Picture

Ricardian Yield is built on **Stacks blockchain** (using Clarity smart contracts) and uses **USDCx** (a stablecoin) for all payments. The system consists of six main smart contracts that work together:

### 1. Property NFT (`property-nft_clar`)

**What it does**: This is like the deed to your property, but as a digital NFT.

When you register a property in the system, it creates a unique NFT that represents that property. This NFT contains all the important information:
- Who owns it
- Where it's located
- How much it's worth
- How much rent it generates
- Links to property documents and photos

**Why it matters**: The NFT proves ownership and makes the property transferable. You can sell the entire property by transferring the NFT, just like selling a house.

### 2. Property Shares (`property-shares_clar`)

**What it does**: This creates the fractional ownership tokens—the "shares" of the property.

When you want to let other people invest in your property, you initialize shares. You decide how many shares to create (like 1,000,000), and these shares can be bought, sold, and traded just like any cryptocurrency token.

**Why it matters**: This is what makes the property accessible to small investors. Instead of needing $500,000 to buy a property, someone can buy $100 worth of shares and still earn proportional rental income.

### 3. Rent Vault (`rent-vault_clar`)

**What it does**: This is like a bank account that holds all the rent money.

When tenants pay rent, they send USDCx tokens directly to this contract. The contract tracks:
- How much rent has been collected for each property
- How much is available for distribution
- What period (month) the rent is for

**Why it matters**: All the money is held securely in a smart contract. No one can steal it or use it without following the rules. Everything is transparent—you can see exactly how much rent has been collected.

### 4. Cash Flow Engine (`cash-flow-engine_clar`)

**What it does**: This is the accounting system. It calculates how much money is actually available to distribute.

Here's how it works:
- **Rent comes in** → Recorded in Rent Vault
- **Expenses go out** → Property owner records operating expenses (maintenance, repairs, etc.)
- **Reserves are set aside** → Working capital reserve (emergency fund) is allocated
- **CapEx is tracked** → Major improvements (like renovations) are recorded separately

The formula is simple:
```
Money Available to Distribute = Rent Collected - Operating Expenses - Working Capital Reserve
```

**Why it matters**: This ensures that only real, actual profits are distributed. If the property needs a new roof, that money is set aside. Shareholders only get paid from actual leftover cash, not from borrowed money or promises.

### 5. Yield Distributor (`yield-distributor_clar`)

**What it does**: This takes the available cash and splits it fairly among all shareholders.

When the property owner decides to distribute profits, this contract:
1. Takes a "snapshot" of who owns how many shares at that moment
2. Calculates how much each person should get based on their share percentage
3. Allows each shareholder to claim their portion

**Why it matters**: The snapshot system prevents manipulation. Someone can't buy shares right before distribution, get paid, and then sell them. The distribution is based on who owned shares when the snapshot was taken.

### 6. Simple DAO (`simple-dao_clar`)

**What it does**: This is the governance system for making big decisions about the property.

When the property needs major improvements (like a $50,000 renovation), shareholders vote on whether to approve it. The voting is weighted by how many shares you own—if you own 10% of the shares, your vote counts for 10%.

**Why it matters**: This gives shareholders a say in how their investment is managed. Major expenses require approval, so one person can't just spend money without consensus.

---

## The Monthly Cycle (How It Actually Works Day-to-Day)

Here's what happens every month:

### Week 1: Rent Collection
- Tenant pays $3,000 rent in USDCx
- Money goes into the Rent Vault
- System records: "Property #1 received $3,000 for Period 5"

### Week 2: Expense Recording
- Property manager records expenses: "$200 for plumbing, $150 for landscaping"
- Cash Flow Engine updates: "Property #1 has $2,650 available ($3,000 - $350)"

### Week 3: Distribution
- Property owner calls `distribute-yield()`
- System creates snapshot: "Alice owns 100,000 shares (10%), Bob owns 50,000 shares (5%)"
- System calculates: "Alice gets $265, Bob gets $132.50"
- Money is withdrawn from Rent Vault and made available for claiming

### Week 4: Shareholders Claim
- Alice calls `claim-yield()` and receives $265 in USDCx
- Bob calls `claim-yield()` and receives $132.50 in USDCx
- Property owner resets the period for next month

---

## Who Can Do What?

The system has different roles for different people:

### Property Owner
- **Can do**: Register properties, distribute yield, reset periods, record expenses
- **Owns**: The Property NFT (the "deed")
- **Responsibility**: Manage the property and trigger distributions

### Shareholders
- **Can do**: Buy/sell shares, vote on proposals, claim yield
- **Owns**: Property Shares tokens
- **Gets**: Proportional share of rental income

### Property Manager
- **Can do**: Record operating expenses
- **Responsibility**: Track maintenance, repairs, and other costs

### Tenants
- **Can do**: Pay rent (transfer USDCx to Rent Vault)
- **Responsibility**: Pay rent on time

### Contract Deployer
- **Can do**: Mint new properties (register them in the system)
- **Responsibility**: Initial setup and property registration

---

## Real Example: How Alice Earns $265 Per Month

Let's say there's a property that generates $3,000/month in rent:

1. **Property Setup**
   - Property owner registers "123 Main Street" as Property #1
   - Creates 1,000,000 shares
   - Property owner keeps 850,000 shares (85%)

2. **Alice Invests**
   - Alice buys 100,000 shares for $10,000 (10% of the property)
   - She now owns 10% of Property #1

3. **Monthly Operations**
   - Tenant pays $3,000 rent → Goes to Rent Vault
   - Manager records $350 in expenses
   - Available: $3,000 - $350 = $2,650

4. **Distribution**
   - Property owner calls `distribute-yield(1)`
   - System calculates: Alice owns 10%, so she gets 10% of $2,650 = $265
   - Alice calls `claim-yield(1, 5)` and receives $265 in USDCx

5. **Next Month**
   - Process repeats
   - Alice continues earning $265/month (or more/less depending on expenses)

---

## Technical Details (For Developers)

### Smart Contract Architecture

The system is built on **Stacks blockchain** using **Clarity** smart contracts. Here's the contract structure:

```
contracts/
├── property-nft_clar.clar          # SIP-009 NFT for properties
├── property-shares_clar.clar        # SIP-010 fungible tokens (shares)
├── rent-vault_clar.clar             # Holds USDCx rent payments
├── cash-flow-engine_clar.clar       # Calculates distributable cash flow
├── yield-distributor_clar.clar      # Distributes yield to shareholders
├── simple-dao_clar.clar             # Governance for CapEx proposals
└── mock-usdcx.clar                  # Mock USDCx for testing
```

### Key Technical Features

- **SIP-009 Compliance**: Property NFTs follow the Stacks NFT standard
- **SIP-010 Compliance**: Property shares follow the fungible token standard
- **USDCx Integration**: Uses real USDCx stablecoin for all payments
- **Snapshot-Based Distribution**: Prevents manipulation by taking ownership snapshots
- **Period-Based Accounting**: Tracks everything by monthly periods
- **Governance Voting**: Weighted voting based on share ownership

### Cash Flow Calculation

The system uses standard accounting principles:

```
Distributable Cash Flow = 
    Rent Collected 
    - Operating Expenses 
    - Working Capital Reserve
```

**Note**: Capital Expenditures (CapEx) like renovations are tracked separately. They affect the property's value but don't reduce monthly distributions. This shows long-term value creation.

### Access Control

- **Property Owner**: Verified by checking NFT ownership via `get-owner()` from Property NFT contract
- **Shareholders**: Anyone who owns Property Shares tokens
- **Managers**: Set by property owner for expense recording
- **Contract Owner**: Only the deployer can mint new properties

---

## Why Stacks/Clarity?

We chose Stacks blockchain and Clarity smart contracts because:

1. **Security First**: Clarity is a decidable language—you can mathematically prove what the code will do
2. **Readable Code**: Clarity code is easier to read and understand than Solidity
3. **Bitcoin Security**: Stacks is secured by Bitcoin, the most secure blockchain
4. **Low Costs**: Transaction fees are much lower than Ethereum
5. **USDCx Support**: Native support for stablecoins

---

## Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Clarinet (Stacks development tool)

### Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd Ricardian-Yield

# Install dependencies
cd contracts/ricardian
npm install

# Run tests
npm test
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- property-nft_clar.test.ts

# Run with verbose output
npm test -- --reporter=verbose
```

---

## Usage Examples

### For Property Owners

```typescript
// Register a new property
await contract.callPublicFn(
  "property-nft_clar",
  "mint-property",
  [
    Cl.standardPrincipal(ownerAddress),
    Cl.stringAscii("123 Main St, New York, NY"),
    Cl.uint(500000),  // Valuation: $500,000
    Cl.uint(3000),    // Monthly rent: $3,000
    Cl.stringAscii("https://example.com/metadata/1")
  ],
  deployer
);

// Initialize shares (1,000,000 shares)
await contract.callPublicFn(
  "property-shares_clar",
  "initialize",
  [
    Cl.contractPrincipal(deployer, "property-nft_clar"),
    Cl.uint(1),           // Property ID
    Cl.uint(1000000),     // Total shares
    Cl.standardPrincipal(ownerAddress)
  ],
  deployer
);

// Distribute yield for the month
await contract.callPublicFn(
  "yield-distributor_clar",
  "distribute-yield",
  [Cl.uint(1)],  // Property ID
  ownerAddress
);
```

### For Tenants

```typescript
// Pay rent (two-step process for SIP-010 compliance)
// Step 1: Transfer USDCx to Rent Vault
await usdcxContract.callPublicFn(
  "usdcx",
  "transfer",
  [
    Cl.uint(3000),  // Amount
    Cl.standardPrincipal(tenantAddress),
    Cl.contractPrincipal(deployer, "rent-vault_clar"),
    Cl.none()
  ],
  tenantAddress
);

// Step 2: Record the deposit
await contract.callPublicFn(
  "rent-vault_clar",
  "deposit-rent",
  [
    Cl.uint(1),     // Property ID
    Cl.uint(3000)   // Amount
  ],
  tenantAddress
);
```

### For Shareholders

```typescript
// Check how much yield you can claim
const result = await contract.callReadOnlyFn(
  "yield-distributor_clar",
  "get-claimable-yield",
  [
    Cl.uint(1),     // Property ID
    Cl.uint(5),     // Period
    Cl.standardPrincipal(shareholderAddress)
  ],
  shareholderAddress
);

// Claim your yield
await contract.callPublicFn(
  "yield-distributor_clar",
  "claim-yield",
  [
    Cl.uint(1),     // Property ID
    Cl.uint(5)      // Period
  ],
  shareholderAddress
);
```

---

## Security & Trust

### What Makes This Secure?

1. **Smart Contract Logic**: All rules are encoded in the contracts—no one can change them
2. **Transparency**: Every transaction is on the blockchain for anyone to verify
3. **Access Control**: Only authorized people can perform certain actions
4. **Snapshot System**: Prevents last-minute manipulation of distributions
5. **No Central Authority**: The system runs automatically—no company or person controls it

### What You Should Know

- **This is experimental software**: While we've tested it thoroughly, use at your own risk
- **Property ownership is separate**: The NFT represents the property, but legal ownership still follows traditional real estate law
- **USDCx is required**: All payments use USDCx stablecoin
- **Gas fees apply**: Every transaction costs a small fee (much lower than Ethereum)

---

## The Vision

Ricardian Yield aims to democratize real estate investment. We want to make it so that:

- A college student can invest $100 in a rental property
- A retiree can diversify their portfolio with real estate tokens
- Property owners can raise capital by selling shares
- Everyone can see exactly where their money goes

This isn't about creating synthetic yields or promises. It's about taking real rental properties, putting them on the blockchain, and letting people earn real rental income.

---

## Contributing

This is an open-source project. We welcome contributions! However, please note:

- This is currently experimental software
- For production use, additional security audits are required
- Real estate regulations vary by jurisdiction—consult legal experts

---

## License

MIT License - Feel free to use, modify, and distribute.

---

## Questions?

If you have questions about how the system works, check out:
- The test files in `contracts/ricardian/tests/` for usage examples
- The contract source code in `contracts/ricardian/contracts/` for implementation details
- The Stacks documentation for Clarity language details

---

**Ricardian Yield: Real properties. Real income. Real transparency.**
