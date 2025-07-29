# MetaKeep Demo: Developer Gas Sponsorship for USDC Transfer

A demonstration of MetaKeep's developer gas sponsorship feature for USDC transfers on Solana Devnet.

## Features

- **Developer Gas Sponsorship**: Developers can pay gas fees for user transactions
- **USDC Transfers**: Transfer USDC tokens between wallets on Solana Devnet
- **MetaKeep Integration**: Uses MetaKeep SDK for wallet management and transaction signing
- **Real-time Balance Updates**: Live balance monitoring for all wallets

## Prerequisites

- Node.js (v14 or higher)
- Solana CLI tools installed
- MetaKeep API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dev-sponsor-gas
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp env.example .env

# Edit .env file with your actual values
nano .env
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MetaKeep API Configuration
METAKEEP_API_KEY=your_metakeep_api_key_here

# Server Configuration
PORT=3001

# Solana Configuration
SOLANA_DEVNET_RPC=https://api.devnet.solana.com
USDC_MINT_DEVNET=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
TRANSFER_AMOUNT=0.01

# MetaKeep App Configuration
METAKEEP_APP_ID=12e48311-ebfb-4776-9b57-39e47533757a
```

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

## Running the Application

1. Start the server:
```bash
npm run server
```

2. In a new terminal, start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## How It Works

### 1. Wallet Setup
- **User A**: Gets wallet through MetaKeep SDK
- **User B**: Uses a predefined wallet address
- **Developer**: Gets wallet through MetaKeep API (proxied through server)

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

## API Endpoints

### Server Endpoints (Port 3001)

- `POST /api/developer-wallet` - Get developer wallet from MetaKeep
- `POST /api/metakeep-sign` - Sign transaction with developer wallet
- `POST /api/solana-balance` - Get SOL balance using Solana CLI

## Security Features

- **Environment Variables**: API keys stored securely in `.env` file
- **Server-side Proxying**: Sensitive API calls proxied through server
- **Input Validation**: Server validates all incoming requests
- **Error Handling**: Comprehensive error handling and logging

## Troubleshooting

### Common Issues

1. **"Missing required environment variable"**
   - Ensure your `.env` file exists and contains `METAKEEP_API_KEY`

2. **"Failed to fetch developer wallet"**
   - Check your MetaKeep API key is valid
   - Verify network connectivity

3. **"Transaction failed"**
   - Ensure developer wallet has sufficient SOL for gas fees
   - Check User A has sufficient USDC balance

4. **"Solana CLI not found"**
   - Install Solana CLI tools: `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=true npm run server
```

## Development

### Project Structure
```
dev-sponsor-gas/
├── server.js          # Express server with API endpoints
├── script.js          # Main application logic
├── config.js          # Configuration constants
├── index.html         # Frontend interface
├── styles.css         # Styling
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (not in git)
├── env.example       # Example environment file
└── .gitignore        # Git ignore rules
```

### Adding New Features

1. **New API Endpoints**: Add to `server.js`
2. **Frontend Logic**: Add to `script.js`
3. **Configuration**: Add to `config.js` or `.env`
4. **Styling**: Add to `styles.css`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License

## Support

For issues and questions:
- Check the troubleshooting section
- Review the console logs for error details
- Ensure all environment variables are set correctly 