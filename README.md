# Developer Gas Sponsorship for USDC Transfer

Demo app showing how developers can pay gas fees for user USDC transfers on Solana Devnet using MetaKeep.

## Quick Start

1. **Install & Setup:**
   ```bash
   npm install
   cp env.example .env
   # Add your MetaKeep API key to .env
   npm run dev
   ```

2. **Open:** `http://localhost:3000`

## Environment Variables

```env
METAKEEP_API_KEY=your_metakeep_api_key_here
NEXT_PUBLIC_METAKEEP_APP_ID=12e48311-ebfb-4776-9b57-39e47533757a
NEXT_PUBLIC_SOLANA_DEVNET_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT_DEVNET=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
NEXT_PUBLIC_TRANSFER_AMOUNT=0.01
```

## How It Works

1. **User A** gets wallet via MetaKeep SDK (requires email)
2. **User B** uses predefined wallet address
3. **Developer** gets wallet via MetaKeep API
4. User A transfers USDC to User B
5. **Developer wallet pays all gas fees**

## API Routes

### `/api/developer-wallet`
- **Method:** POST
- **Purpose:** Get developer wallet from MetaKeep
- **Response:** `{ status: "SUCCESS", wallet: { solAddress: "..." } }`

### `/api/metakeep-sign`
- **Method:** POST
- **Purpose:** Sign transaction with developer wallet
- **Body:** Transaction data from frontend
- **Response:** Signed transaction data

### `/api/solana-balance`
- **Method:** POST
- **Body:** `{ "address": "wallet_address" }`
- **Purpose:** Get SOL balance via RPC
- **Response:** `{ status: "SUCCESS", balance: "1.23456" }`

### `/api/usdc-balance`
- **Method:** POST
- **Body:** `{ "address": "wallet_address" }`
- **Purpose:** Get USDC balance via RPC
- **Response:** `{ status: "SUCCESS", balance: "10.50" }`

## Tech Stack

- **Next.js 14** - React framework
- **MetaKeep SDK** - Wallet management & signing
- **Solana Web3.js** - Blockchain interaction
- **TypeScript** - Type safety

## Project Structure

```
├── app/api/           # API routes
├── components/        # React components
├── hooks/            # Custom React hooks
└── package.json
```


