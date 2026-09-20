# LexIntent — Decentralized Arbitration for Freelancers

A full-stack Solana dApp that provides trustless escrow agreements with decentralized jury-based dispute resolution. Clients lock SOL in escrow with a statement of intent; if either party disputes the work, a panel of staked jurors votes via a commit/reveal scheme to decide where funds go.

## Architecture

### Smart Contract (`programs/lex_intent/`)
An Anchor/Rust program with the following instructions:

| Instruction | Description |
|---|---|
| `create_escrow(amount, intent_text)` | Locks SOL in a PDA vault, creates an escrow agreement |
| `accept_work()` | Client releases funds to the freelancer |
| `file_dispute()` | Freezes funds, transitions to Disputed state |
| `stake_for_jury(amount)` | Users stake SOL to become jurors |
| `commit_vote(vote_hash)` | Jurors submit a hashed vote (commit phase) |
| `reveal_vote(vote, salt)` | Jurors reveal their vote; 2/3 majority releases funds to the winner |

**Program ID (placeholder):** `LexIntent111111111111111111111111111111111111`

### Frontend (`src/`)
React + Vite + Tailwind CSS + shadcn/ui with Solana Wallet Adapter.

| Screen | Route | Description |
|---|---|---|
| Dashboard | `#/` | Lists active agreements, stats, and a "Create Agreement" button |
| Create Agreement | `#/create` | Form for freelancer address, SOL amount, and statement of intent |
| Agreement Detail | `#/agreement/:id` | Shows status, parties, timeline, and Accept Work / File Dispute actions |
| Jury Dashboard | `#/jury` | Stake SOL to become a juror, view and vote on disputes |

### Demo Mode
The frontend runs in a **demo mode** using localStorage to simulate on-chain interactions. This allows you to explore the full UX without deploying the contract. When a Solana wallet is connected (Phantom/Solflare on devnet), the wallet adapter handles connection state and the demo store uses the connected address for transactions.

## Setup

### Prerequisites
- Node.js 18+
- A Solana wallet (Phantom or Solflare) set to **Devnet**

### Frontend
```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

### Smart Contract (optional — for on-chain deployment)
Requires the [Solana CLI](https://docs.solana.com/cli/install-solana) and [Anchor](https://www.anchor-lang.com/) v0.29.0:

```bash
# Configure Solana CLI for devnet
solana config set --url https://api.devnet.solana.com

# Generate a new program ID and update declare_id! in programs/lex_intent/src/lib.rs
anchor keys list

# Build and deploy
anchor build
anchor deploy --provider.cluster devnet
```

Update the program ID in:
- `programs/lex_intent/src/lib.rs` (`declare_id!`)
- `Anchor.toml`

## Features
- **Wallet Connect** — Phantom & Solflare support via Solana Wallet Adapter
- **Transaction History** — Slide-out panel showing all on-chain interactions
- **Toast Notifications** — Success and error feedback for every action
- **Commit/Reveal Voting** — Jurors hash their vote with a secret salt, then reveal later
- **Dark Theme** — Solana-inspired dark UI with purple (#8B5CF6) primary and teal (#14B8A6) accent
- **Responsive** — Works on mobile and desktop

## Tech Stack
- **Smart Contract:** Anchor 0.29.0, Solana 1.18
- **Frontend:** React 18, Vite 5, TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Lucide icons
- **Web3:** @solana/web3.js, @solana/wallet-adapter
- **Network:** Solana Devnet

## Project Structure
```
├── programs/lex_intent/       # Anchor smart contract (Rust)
│   ├── Cargo.toml
│   └── src/lib.rs
├── src/
│   ├── components/            # UI components (layout, wallet, tx history)
│   ├── screens/               # 4 main screens
│   ├── providers/            # Solana wallet + demo store providers
│   ├── lib/                  # Types, router, utils
│   └── components/ui/        # shadcn/ui components
├── Anchor.toml               # Anchor configuration
├── index.html
└── package.json
```
