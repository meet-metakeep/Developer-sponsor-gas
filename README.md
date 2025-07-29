# MetaKeep Demo: Developer Gas Sponsorship for USDC Transfer

A modern Next.js application demonstrating MetaKeep's developer gas sponsorship feature for USDC transfers on Solana Devnet.

## 🚀 Features

- **Next.js 14**: Modern React framework with App Router
- **TypeScript**: Full type safety
- **Developer Gas Sponsorship**: Developers can pay gas fees for user transactions
- **USDC Transfers**: Transfer USDC tokens between wallets on Solana Devnet
- **MetaKeep Integration**: Uses MetaKeep SDK for wallet management and transaction signing
- **Real-time Balance Updates**: Live balance monitoring for all wallets
- **No Solana CLI Dependency**: Uses RPC calls instead of CLI commands

## 🛠️ Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **MetaKeep SDK** - For user wallet management and transaction signing
- **Solana Web3.js** - For Solana blockchain interaction
- **Tailwind CSS** - For styling (optional)

## 📋 Prerequisites

- Node.js (v18 or higher)
- MetaKeep API key

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd dev-sponsor-gas
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp env.example .env

   # Edit .env file with your actual values
   nano .env
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

### Environment Variables

Create a `.env` file in the root directory:

```env
# MetaKeep API Configuration (server-side only)
METAKEEP_API_KEY=your_metakeep_api_key_here

# Next.js Public Environment Variables (available in browser)
NEXT_PUBLIC_METAKEEP_APP_ID=12e48311-ebfb-4776-9b57-39e47533757a
NEXT_PUBLIC_SOLANA_DEVNET_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT_DEVNET=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
NEXT_PUBLIC_TRANSFER_AMOUNT=0.01

# Server Environment Variables (server-side only)
PORT=3000
```

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.



## 🏗️ Project Structure

```
dev-sponsor-gas/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── developer-wallet/
│   │   ├── metakeep-sign/
│   │   ├── solana-balance/
│   │   └── usdc-balance/
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── MetaKeepApp.tsx
│   ├── WalletCard.tsx
│   ├── ActionButtons.tsx
│   └── StatusSection.tsx
├── hooks/                 # Custom React hooks
│   ├── useMetaKeepSDK.ts
│   ├── useSolanaConnection.ts
│   ├── useWalletBalances.ts
│   └── useTransfer.ts
├── package.json           # Dependencies and scripts
├── next.config.js         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── .env                   # Environment variables (not in git)
├── env.example            # Example environment file
└── .gitignore            # Git ignore rules
```

## 🔧 How It Works

### 1. Wallet Setup
- **User A**: Gets wallet through MetaKeep SDK
- **User B**: Uses a predefined wallet address
- **Developer**: Gets wallet through MetaKeep API

### 2. USDC Transfer Process
1. Check User A's USDC balance
2. Build transfer transaction
3. User A signs the transaction (MetaKeep SDK)
4. Developer signs and submits the transaction (MetaKeep API)
5. Transaction is confirmed on Solana Devnet

### 3. Gas Sponsorship
- Developer wallet pays all gas fees
- User A only needs USDC tokens, no SOL required
- Transaction fees are deducted from developer's SOL balance

## 🌐 API Routes

### `/api/developer-wallet`
- **Method**: POST
- **Purpose**: Get developer wallet from MetaKeep
- **Security**: Uses server-side API key

### `/api/metakeep-sign`
- **Method**: POST
- **Purpose**: Sign transaction with developer wallet
- **Security**: Uses server-side API key

### `/api/solana-balance`
- **Method**: POST
- **Purpose**: Get SOL balance using RPC (no CLI dependency)
- **Body**: `{ "address": "wallet_address" }`

## 🔒 Security Features

- **Environment Variables**: API keys stored securely in `.env` file
- **Server-side Proxying**: Sensitive API calls proxied through Next.js API routes
- **Input Validation**: Server validates all incoming requests
- **Error Handling**: Comprehensive error handling and logging
- **Type Safety**: Full TypeScript support



## 🐛 Troubleshooting

### Common Issues

1. **"Missing required environment variable"**
   - Ensure your `.env` file exists and contains `METAKEEP_API_KEY`

2. **"Failed to fetch developer wallet"**
   - Check your MetaKeep API key is valid
   - Verify network connectivity

3. **"Transaction failed"**
   - Ensure developer wallet has sufficient SOL for gas fees
   - Check User A has sufficient USDC balance

4. **TypeScript errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check that all environment variables are properly set

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=true npm run dev
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- **Netlify**: Supports Next.js with proper configuration
- **Railway**: Easy deployment with environment variable support
- **Heroku**: Requires additional build configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC License

## 🆘 Support

For issues and questions:
- Check the troubleshooting section
- Review the console logs for error details
- Ensure all environment variables are set correctly
- Check the Next.js documentation for framework-specific issues 