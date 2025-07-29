/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    METAKEEP_API_KEY: process.env.METAKEEP_API_KEY,
    METAKEEP_APP_ID: process.env.METAKEEP_APP_ID,
    SOLANA_DEVNET_RPC: process.env.SOLANA_DEVNET_RPC,
    USDC_MINT_DEVNET: process.env.USDC_MINT_DEVNET,
    TRANSFER_AMOUNT: process.env.TRANSFER_AMOUNT,
  },
}

module.exports = nextConfig 