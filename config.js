// MetaKeep Gas Sponsorship Demo Configuration

const CONFIG = {
    // MetaKeep Configuration
    METAKEEP: {
        APP_ID: "12e48311-ebfb-4776-9b57-39e47533757a",
        USER_EMAIL: "meet@metakeep.xyz",
        USER_B_EMAIL: ""
    },
    
    // Solana Configuration
    SOLANA: {
        DEVNET_RPC: "https://api.devnet.solana.com",
        USDC_MINT_DEVNET: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
        TRANSFER_AMOUNT: 0.01, // USDC amount to transfer
        DEV_WALLET: "" // Fallback demo developer wallet
    },
    
    // UI Configuration
    UI: {
        REFRESH_DELAY: 2000, // Delay before refreshing balances after transaction
        API_SIMULATION_DELAY: 1000, // Delay for simulating API calls
        STATUS_MESSAGE_TIMEOUT: 5000 // Timeout for status messages
    },
    
    // API Configuration (for production)
    API: {
        METAKEEP_BASE_URL: "https://api.metakeep.xyz",
        DEVELOPER_SIGN_ENDPOINT: "/v2/app/transaction/sign"
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    // Browser environment
    window.CONFIG = CONFIG;
} 