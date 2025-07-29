// ====================================================================
// REBUILT USDC TRANSFER WITH BROWSER-NATIVE APPROACH
// No external SPL Token dependencies - using pure Solana Web3.js
// ====================================================================

// Global variables
let sdk;
let connection;
let userAWallet, userBWallet, devWallet;
let usdcMint;

// Solana Program IDs (hardcoded constants)
const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Constants
const USDC_MINT_DEVNET = CONFIG.SOLANA.USDC_MINT_DEVNET;
const TRANSFER_AMOUNT = CONFIG.SOLANA.TRANSFER_AMOUNT;
const SOLANA_DEVNET_RPC = CONFIG.SOLANA.DEVNET_RPC;
const METAKEEP_API_BASE = CONFIG.API.METAKEEP_BASE_URL;

// DOM elements
const statusMessage = document.getElementById('statusMessage');
const transactionInfo = document.getElementById('transactionInfo');
const txSignature = document.getElementById('txSignature');
const solscanLink = document.getElementById('solscanLink');
const transferButton = document.getElementById('transferUSDC');
const refreshButton = document.getElementById('refreshBalances');

// ====================================================================
// NATIVE BROWSER-COMPATIBLE HELPER FUNCTIONS
// ====================================================================

// Get Associated Token Address using native Solana Web3.js
function getAssociatedTokenAddress(mint, owner) {
    const [address] = solanaWeb3.PublicKey.findProgramAddressSync(
        [
            owner.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return address;
}

// Create transfer instruction using native Solana Web3.js
function createTransferInstruction(source, destination, owner, amount) {
    const keys = [
        { pubkey: source, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
    ];
    
    // Create instruction data for SPL Token Transfer (instruction index 3)
    const instructionData = new Uint8Array(9);
    instructionData[0] = 3; // Transfer instruction
    
    // Convert amount to little-endian 8 bytes
    const amountBN = BigInt(amount);
    for (let i = 0; i < 8; i++) {
        instructionData[1 + i] = Number((amountBN >> BigInt(i * 8)) & BigInt(0xFF));
    }
    
    return new solanaWeb3.TransactionInstruction({
        keys,
        programId: TOKEN_PROGRAM_ID,
        data: instructionData
    });
}

// Create Associated Token Account instruction
function createAssociatedTokenAccountInstruction(payer, associatedToken, owner, mint) {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedToken, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: solanaWeb3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];
    
    return new solanaWeb3.TransactionInstruction({
        keys,
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        data: new Uint8Array(0) // No instruction data needed
    });
}

// Parse token account data
async function parseTokenAccount(connection, address) {
    const accountInfo = await connection.getAccountInfo(address);
    if (!accountInfo) {
        throw new Error('Token account not found');
    }
    
    const data = accountInfo.data;
    if (data.length < 165) {
        throw new Error('Invalid token account data');
    }
    
    // Extract mint (first 32 bytes)
    const mint = new solanaWeb3.PublicKey(data.slice(0, 32));
    
    // Extract owner (bytes 32-64)
    const owner = new solanaWeb3.PublicKey(data.slice(32, 64));
    
    // Extract amount (bytes 64-72, little-endian)
    let amount = BigInt(0);
    for (let i = 0; i < 8; i++) {
        amount += BigInt(data[64 + i]) << BigInt(i * 8);
    }
    
    return {
        mint,
        owner,
        amount: amount.toString()
    };
}

// ====================================================================
// APPLICATION LOGIC
// ====================================================================

// Initialize the application
async function initialize() {
    try {
        updateStatus('Initializing MetaKeep SDK and Solana connection...', 'info');
        
        // Initialize MetaKeep SDK
        sdk = new MetaKeep({
            appId: CONFIG.METAKEEP.APP_ID,
            user: {
                email: CONFIG.METAKEEP.USER_EMAIL
            }
        });

        // Initialize Solana connection
        connection = new solanaWeb3.Connection(SOLANA_DEVNET_RPC, 'confirmed');
        
        // Test connection
        const version = await connection.getVersion();
        console.log('Solana connection established. Version:', version);
        
        // Initialize USDC mint
        usdcMint = new solanaWeb3.PublicKey(USDC_MINT_DEVNET);
        console.log('USDC Mint Address (Devnet):', USDC_MINT_DEVNET);
        
        // Validate USDC mint exists
        try {
            const mintInfo = await connection.getAccountInfo(usdcMint);
            if (!mintInfo) {
                throw new Error('USDC mint account not found on Solana Devnet');
            }
            console.log(' USDC mint validated on Solana Devnet');
        } catch (mintError) {
            console.error(' USDC mint validation failed:', mintError);
            updateStatus('Warning: USDC mint validation failed - transfers may not work', 'warning');
        }
        
        // Generate wallets
        await generateWallets();
        
        // Load initial balances
        await refreshAllBalances();
        
        // Check USDC balance and update transfer button state
        await updateTransferButtonState();
        
        updateStatus('');
        
    } catch (error) {
        console.error('Initialization error:', error);
        updateStatus(`Initialization failed: ${error.message}`, 'error');
    }
}

// Generate wallets for the demo
async function generateWallets() {
    try {
        updateStatus('Getting User A wallet...', 'info');
        
        // Get User A wallet using MetaKeep SDK
        try {
            console.log('Calling MetaKeep SDK getWallet()...');
            const userAResponse = await sdk.getWallet();
            console.log("getWallet successful");
            console.log('Full User A Response:', JSON.stringify(userAResponse, null, 2));
            
            // Handle the response according to MetaKeep SDK format
            if (userAResponse && userAResponse.status === 'SUCCESS' && userAResponse.wallet && userAResponse.wallet.solAddress) {
                userAWallet = userAResponse.wallet.solAddress;
                console.log('User A Solana wallet extracted:', userAWallet);
                
                // Validate the wallet address format
                try {
                    new solanaWeb3.PublicKey(userAWallet);
                    console.log('User A wallet address is valid Solana public key');
                } catch (validateError) {
                    console.error('User A wallet address is not a valid Solana public key:', validateError);
                    throw new Error('Invalid Solana wallet address format');
                }
            } else {
                console.error('Invalid response format:', userAResponse);
                console.error('Expected: {status: "SUCCESS", wallet: {solAddress: "..."}}');
                throw new Error('Invalid wallet response format from MetaKeep SDK');
            }
        } catch (err) {
            console.error("Error when trying to get User A wallet:");
            console.error('Error details:', err);
            throw new Error(`Failed to get User A wallet: ${err.message}`);
        }
        
        updateStatus('Getting User B wallet...', 'info');
        
        // For User B, use the provided wallet address
        userBWallet = "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV";
        console.log('User B wallet set to:', userBWallet);
        
        updateStatus('Getting developer wallet...', 'info');
        
        // Get developer wallet using MetaKeep API
        devWallet = await getDeveloperWallet();
        console.log('Developer wallet retrieved:', devWallet);
        
        // Update UI with wallet addresses
        document.getElementById('userAAddress').textContent = userAWallet || 'Failed to load';
        document.getElementById('userBAddress').textContent = userBWallet;
        document.getElementById('devAddress').textContent = devWallet;
        
        console.log('Final wallet addresses:');
        console.log('- User A:', userAWallet);
        console.log('- User B:', userBWallet);
        console.log('- Developer:', devWallet);
        
        updateStatus('All wallets retrieved successfully!', 'success');
        
    } catch (error) {
        console.error('Wallet generation error:', error);
        updateStatus(`Wallet generation failed: ${error.message}`, 'error');
    }
}

// Get developer wallet using backend proxy
async function getDeveloperWallet() {
    try {
        const response = await fetch('http://localhost:3001/api/developer-wallet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Developer wallet response:', data);
        
        if (data.status === 'SUCCESS' && data.wallet && data.wallet.solAddress) {
            return data.wallet.solAddress;
        } else {
            throw new Error('Invalid response format from MetaKeep API');
        }
        
    } catch (error) {
        console.error('Error getting developer wallet:', error);
        // Fallback to demo wallet if API fails
        return CONFIG.SOLANA.DEV_WALLET;
    }
}

// Refresh all wallet balances
async function refreshAllBalances() {
    try {
        updateStatus('Refreshing balances', 'info');
        
        // Refresh User A balances
        await refreshWalletBalances('userA', userAWallet);
        
        // Refresh User B balances
        await refreshWalletBalances('userB', userBWallet);
        
        // Refresh Developer wallet balances
        await refreshWalletBalances('dev', devWallet);
        
        // Update transfer button state after refreshing balances
        await updateTransferButtonState();
        
        // Only show success message if transfer button is enabled (meaning no error)
        if (!transferButton.disabled) {
            updateStatus('Balances refreshed successfully!', 'success');
        }
        
    } catch (error) {
        console.error('Balance refresh error:', error);
        updateStatus(`Failed to refresh balances: ${error.message}`, 'error');
    }
}

// Refresh balances for a specific wallet
async function refreshWalletBalances(prefix, walletAddress) {
    try {
        // Check if wallet address is valid
        if (!walletAddress || walletAddress === 'Failed to load' || walletAddress === '[object Object]') {
            console.error(`Invalid wallet address for ${prefix}:`, walletAddress);
            document.getElementById(`${prefix}SOL`).textContent = 'Error';
            document.getElementById(`${prefix}USDC`).textContent = 'Error';
            return;
        }
        
        console.log(`Refreshing balances for ${prefix} wallet: ${walletAddress}`);
        const pubkey = new solanaWeb3.PublicKey(walletAddress);
        
        // Special handling for developer wallet - use Solana CLI
        if (prefix === 'dev') {
            await refreshDeveloperBalance(walletAddress);
        } else {
            // Get SOL balance using RPC for non-developer wallets
            const lamports = await connection.getBalance(pubkey);
            const solBalance = (lamports / solanaWeb3.LAMPORTS_PER_SOL).toFixed(4);
            document.getElementById(`${prefix}SOL`).textContent = `${solBalance} SOL`;
            console.log(`${prefix} SOL balance: ${solBalance}`);
        }
        
        // Get USDC balance using native approach
        try {
            console.log(`Getting USDC ATA for ${prefix} wallet...`);
            const ata = getAssociatedTokenAddress(usdcMint, pubkey);
            console.log(`${prefix} USDC ATA: ${ata.toString()}`);
            
            // Check if ATA exists
            const ataInfo = await connection.getAccountInfo(ata);
            if (!ataInfo) {
                console.log(`${prefix} USDC ATA does not exist yet`);
                document.getElementById(`${prefix}USDC`).textContent = '0.00 USDC (No ATA)';
                return;
            }
            
            // Parse the token account
            const accountInfo = await parseTokenAccount(connection, ata);
            const usdcBalance = (Number(accountInfo.amount) / 1e6).toFixed(2);
            document.getElementById(`${prefix}USDC`).textContent = `${usdcBalance} USDC`;
            console.log(`${prefix} USDC balance: ${usdcBalance} USDC`);
            
            // Additional debugging for User A
            if (prefix === 'userA') {
                console.log(`User A USDC Token Account Details:`, {
                    address: ata.toString(),
                    mint: accountInfo.mint.toString(),
                    owner: accountInfo.owner.toString(),
                    amount: accountInfo.amount.toString(),
                    decimals: 6,
                    usdcBalance: usdcBalance
                });
            }
            
        } catch (err) {
            console.error(`Error getting USDC balance for ${prefix}:`, err);
            
            // More specific error handling
            if (err.message.includes('Token account not found')) {
                console.log(`${prefix} USDC ATA account not found`);
                document.getElementById(`${prefix}USDC`).textContent = '0.00 USDC (No ATA)';
            } else {
                console.log(`${prefix} Unknown USDC error:`, err.message);
                document.getElementById(`${prefix}USDC`).textContent = 'Error';
            }
        }
        
    } catch (error) {
        console.error(`Error refreshing ${prefix} balances:`, error);
        document.getElementById(`${prefix}SOL`).textContent = 'Error';
        document.getElementById(`${prefix}USDC`).textContent = 'Error';
    }
}

// Check if User A has sufficient USDC balance
async function checkUserAUSDCBalance() {
    try {
        if (!userAWallet) {
            return { hasBalance: false, balance: 0, message: 'User A wallet not available' };
        }
        
        const userAPubkey = new solanaWeb3.PublicKey(userAWallet);
        const ata = getAssociatedTokenAddress(usdcMint, userAPubkey);
        
        // Check if ATA exists
        const ataInfo = await connection.getAccountInfo(ata);
        if (!ataInfo) {
            return { hasBalance: false, balance: 0, message: 'User A has no USDC token asset' };
        }
        
        // Parse the token account
        const accountInfo = await parseTokenAccount(connection, ata);
        const usdcBalance = Number(accountInfo.amount) / 1e6;
        
        console.log(`User A USDC balance: ${usdcBalance} USDC`);
        console.log(`Required for transfer: ${TRANSFER_AMOUNT} USDC`);
        
        if (usdcBalance >= TRANSFER_AMOUNT) {
            return { hasBalance: true, balance: usdcBalance, message: '' };
        } else {
            return { 
                hasBalance: false, 
                balance: usdcBalance, 
                message: `User A has insufficient USDC on devnet. Please fund this wallet with devnet USDC to see the demo in action. Visit here: https://faucet.circle.com/` 
            };
        }
        
    } catch (error) {
        console.error('Error checking User A USDC balance:', error);
        return { hasBalance: false, balance: 0, message: `Error checking USDC balance: ${error.message}` };
    }
}

// Refresh developer balance using Solana CLI
async function refreshDeveloperBalance(walletAddress) {
    try {
        console.log('Getting developer balance using Solana CLI...');
        
        // Call the Solana CLI command
        const response = await fetch('http://localhost:3001/api/solana-balance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: walletAddress
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Developer balance response:', data);
        
        if (data.status === 'SUCCESS' && data.balance) {
            // Use the exact balance value from CLI without truncating
            const solBalance = data.balance;
            document.getElementById('devSOL').textContent = `${solBalance} SOL`;
            console.log(`Developer SOL balance updated to: ${solBalance} SOL`);
            console.log(`Raw balance value from CLI: "${data.balance}"`);
        } else {
            throw new Error('Invalid balance response format');
        }
        
    } catch (error) {
        console.error('Error getting developer balance:', error);
        document.getElementById('devSOL').textContent = 'Error';
    }
}



// Transfer USDC from User A to User B
async function transferUSDC() {
    try {
        // Clear previous transaction info
        clearTransactionInfo();
        
        // Check User A's USDC balance first
        updateStatus('Checking User A USDC balance...', 'info');
        const balanceCheck = await checkUserAUSDCBalance();
        
        if (!balanceCheck.hasBalance) {
            updateStatus(balanceCheck.message, 'error');
            transferButton.disabled = true;
            transferButton.textContent = 'Transfer 0.01 USDC (A → B)';
            return;
        }
        
        // Enable transfer button if balance is sufficient
        transferButton.disabled = false;
        transferButton.textContent = 'Processing...';
        
        updateStatus('Building USDC transfer transaction...', 'info');
        
        // Build the USDC transfer transaction
        const transaction = await buildUSDCTransferTransaction();
        
        updateStatus('Requesting User A signature...', 'info');
        
        // Get user signature using MetaKeep SDK
        // Following the exact pattern from MetaKeep documentation
        const userSignature = await sdk.signTransaction(
            transaction,                              // Transaction object (with recentBlockhash and feePayer set)
            `Transfer ${TRANSFER_AMOUNT} USDC to User B`  // Simple string reason
        );
        
        console.log('[SUCCESS]  User A signed the transaction successfully!');
        console.log('User signature response:', userSignature);
        
        // Show User A's signed message
        showUserSignedMessage(userSignature);
        updateStatus('Developer wallet signing and submitting transaction...', 'info');
        
        // Developer signs and submits the transaction
        await developerSignAndSubmit(transaction, userSignature);
        
    } catch (error) {
        console.error(' Transfer error:', error);
        updateStatus(`[ERROR] Transfer failed: ${error.message}`, 'error');
        
        // Re-enable transfer button and update state
        await updateTransferButtonState();
    }
}

// Build USDC transfer transaction
async function buildUSDCTransferTransaction() {
    try {
        const userAPubkey = new solanaWeb3.PublicKey(userAWallet);
        const userBPubkey = new solanaWeb3.PublicKey(userBWallet);
        
        // Get associated token accounts
        const userAATA = getAssociatedTokenAddress(usdcMint, userAPubkey);
        const userBATA = getAssociatedTokenAddress(usdcMint, userBPubkey);
        
        console.log('Transfer transaction details:');
        console.log('- User A ATA:', userAATA.toString());
        console.log('- User B ATA:', userBATA.toString());
        
        // Get recent blockhash - REQUIRED for MetaKeep SDK
        const { blockhash } = await connection.getLatestBlockhash();
        
        // Create transaction
        const transaction = new solanaWeb3.Transaction();
        
        // Check if User B's ATA exists, if not, create it
        const userBATAInfo = await connection.getAccountInfo(userBATA);
        if (!userBATAInfo) {
            console.log('Creating Associated Token Account for User B...');
            const createATAInstruction = createAssociatedTokenAccountInstruction(
                new solanaWeb3.PublicKey(devWallet), // payer (Developer pays gas)
                userBATA,    // ata address
                userBPubkey, // owner (User B)
                usdcMint     // mint
            );
            transaction.add(createATAInstruction);
        } else {
            console.log('User B USDC ATA already exists');
        }
        
        // Add transfer instruction
        const transferAmount = Math.floor(TRANSFER_AMOUNT * 1e6); // Convert to smallest units
        console.log(`Adding transfer instruction for ${transferAmount} smallest units (${TRANSFER_AMOUNT} USDC)`);
        
        const transferInstruction = createTransferInstruction(
            userAATA,     // source
            userBATA,     // destination  
            userAPubkey,  // owner
            transferAmount
        );
        transaction.add(transferInstruction);
        
        // CRITICAL: Set recentBlockhash and feePayer as required by MetaKeep SDK
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new solanaWeb3.PublicKey(devWallet); // Developer pays the fees
        
        console.log('Transaction built successfully with 1 instructions');
        console.log('- Recent blockhash:', blockhash);
        console.log('- Fee payer (Developer):', devWallet);
        
        return transaction;
        
    } catch (error) {
        console.error('Error building USDC transfer transaction:', error);
        throw error;
    }
}

// Developer signs and submits the transaction using MetaKeep API
async function developerSignAndSubmit(transaction, userSignature) {
    try {
        // Convert hex signature to Uint8Array (browser-native approach)
        function hexToUint8Array(hex) {
            // Remove '0x' prefix if present
            const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
            const bytes = new Uint8Array(cleanHex.length / 2);
            for (let i = 0; i < cleanHex.length; i += 2) {
                bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
            }
            return bytes;
        }
        
        // Add the user's signature to the transaction
        transaction.addSignature(
            new solanaWeb3.PublicKey(userAWallet),
            hexToUint8Array(userSignature.signature)
        );
        
        // Serialize the transaction message for MetaKeep API
        // This is the format MetaKeep expects for Solana transactions
        const serializedMessage = transaction.serializeMessage();
        const serializedMessageHex = '0x' + Array.from(serializedMessage).map(b => b.toString(16).padStart(2, '0')).join('');
        
        console.log('Serialized transaction message length:', serializedMessage.length);
        console.log('Serialized transaction message (hex):', serializedMessageHex);
        
        // Prepare the API request in the correct format for MetaKeep
        const apiRequest = {
            transactionObject: {
                serializedTransactionMessage: serializedMessageHex
            },
            reason: "Developer gas sponsorship for USDC transfer"
        };
        
        console.log('MetaKeep Developer Sign API Request:', JSON.stringify(apiRequest, null, 2));
        
        // Call MetaKeep API to sign with developer wallet
        const response = await fetch(`http://localhost:3001/api/metakeep-sign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiRequest)
        });
        
        const result = await response.json();
        console.log('MetaKeep Developer Sign API Response:', result);
        
        if (!response.ok || result.status !== 'SUCCESS') {
            throw new Error(`Developer signing failed: ${result.message || result.error || 'Unknown error'}`);
        }
        
        // Show developer's signature
        showDeveloperSignature(result.signature);
        
        // Add developer signature to the transaction
        const devSignatureBytes = hexToUint8Array(result.signature);
        transaction.addSignature(
            new solanaWeb3.PublicKey(devWallet),
            devSignatureBytes
        );
        
        console.log('Transaction fully signed. Submitting to network...');
        updateStatus('Submitting transaction to Solana network...', 'info');
        
        // Submit the fully signed transaction
        const txid = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed'
        });
        
        console.log('Transaction submitted:', txid);
        updateStatus(`Transaction submitted! TX ID: ${txid}`, 'success');
        
        // Wait for confirmation
        updateStatus('Waiting for transaction confirmation...', 'info');
        const confirmation = await connection.confirmTransaction(txid, 'confirmed');
        console.log('Transaction confirmed:', confirmation);
        
        if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        // Show success and transaction details
        updateStatus('USDC transfer completed successfully!', 'success');
        showTransactionInfo(txid);
        
        // Force refresh developer balance to show updated SOL after gas fees
        updateStatus('Refreshing balances to show gas fee deduction...', 'info');
        await refreshAllBalances();
        
        // Re-enable transfer button after successful transaction
        transferButton.disabled = false;
        transferButton.textContent = ' Transfer 0.01 USDC (A → B)';
        
    } catch (error) {
        console.error('Developer signing error:', error);
        updateStatus(`Transfer failed: ${error.message}`, 'error');
        throw error;
    } finally {
        // Re-enable transfer button
        transferButton.disabled = false;
        transferButton.textContent = '💸 Transfer 0.01 USDC (A → B)';
    }
}

// Call MetaKeep developer signing API
async function callMetaKeepDeveloperSignAPI(serializedMessage) {
    try {
        const requestBody = {
            transactionObject: {
                serializedTransactionMessage: `0x${serializedMessage}`
            },
            reason: "Developer gas sponsorship for USDC transfer"
        };
        
        // For demo purposes, we'll simulate the API response
        console.log('MetaKeep Developer Sign API Request:', requestBody);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, CONFIG.UI.API_SIMULATION_DELAY));
        
        // Return a mock signature
        return "0x" + "1".repeat(128); // Mock signature
        
    } catch (error) {
        console.error('MetaKeep API error:', error);
        throw new Error(`MetaKeep API call failed: ${error.message}`);
    }
}

// Show transaction details
function showTransactionInfo(signature) {
    txSignature.textContent = signature;
    solscanLink.href = `https://solscan.io/tx/${signature}?cluster=devnet`;
    transactionInfo.style.display = 'block';
    
    // Scroll to transaction info
    transactionInfo.scrollIntoView({ behavior: 'smooth' });
    
    console.log('Transaction details displayed:');
    console.log('- Signature:', signature);
    console.log('- Solscan URL:', `https://solscan.io/tx/${signature}?cluster=devnet`);
}

// Show user's signed message
function showUserSignedMessage(userSignature) {
    const userSignedSection = document.getElementById('userSignedMessage');
    if (userSignedSection) {
        const signatureText = userSignedSection.querySelector('.signature-text');
        if (signatureText) {
            signatureText.textContent = userSignature.signature;
        }
        userSignedSection.style.display = 'block';
    }
}

// Show developer's transaction signature
function showDeveloperSignature(devSignature) {
    const devSignedSection = document.getElementById('developerSignature');
    if (devSignedSection) {
        const signatureText = devSignedSection.querySelector('.signature-text');
        if (signatureText) {
            signatureText.textContent = devSignature;
        }
        devSignedSection.style.display = 'block';
    }
}

// Clear previous transaction information
function clearTransactionInfo() {
    const userSignedSection = document.getElementById('userSignedMessage');
    const devSignedSection = document.getElementById('developerSignature');
    const transactionInfo = document.getElementById('transactionInfo');
    const usdcWarning = document.getElementById('usdcWarning');
    
    if (userSignedSection) {
        userSignedSection.style.display = 'none';
        const signatureText = userSignedSection.querySelector('.signature-text');
        if (signatureText) signatureText.textContent = '';
    }
    
    if (devSignedSection) {
        devSignedSection.style.display = 'none';
        const signatureText = devSignedSection.querySelector('.signature-text');
        if (signatureText) signatureText.textContent = '';
    }
    
    if (transactionInfo) {
        transactionInfo.style.display = 'none';
        const txSignature = document.getElementById('txSignature');
        if (txSignature) txSignature.textContent = '';
    }
    
    // Don't clear USDC warning as it should persist until balance is sufficient
}

// Update transfer button state based on USDC balance
async function updateTransferButtonState() {
    try {
        const balanceCheck = await checkUserAUSDCBalance();
        const usdcWarning = document.getElementById('usdcWarning');
        const currentUSDCBalance = document.getElementById('currentUSDCBalance');
        
        if (balanceCheck.hasBalance) {
            transferButton.disabled = false;
            transferButton.textContent = ' Transfer 0.01 USDC (A → B)';
            // Hide USDC warning if balance is sufficient
            if (usdcWarning) {
                usdcWarning.style.display = 'none';
            }
            // Clear any previous error messages if balance is now sufficient
            if (statusMessage.textContent.includes('insufficient USDC')) {
                updateStatus('', 'info');
            }
        } else {
            transferButton.disabled = true;
            transferButton.textContent = ' Transfer 0.01 USDC (A → B)';
            // Show USDC warning with current balance
            if (usdcWarning) {
                usdcWarning.style.display = 'block';
                if (currentUSDCBalance) {
                    currentUSDCBalance.textContent = `${balanceCheck.balance.toFixed(2)} USDC`;
                }
            }
            // Show error message for insufficient USDC
            updateStatus(balanceCheck.message, 'error');
        }
    } catch (error) {
        console.error('Error updating transfer button state:', error);
        transferButton.disabled = true;
        transferButton.textContent = ' Transfer 0.01 USDC (A → B)';
        updateStatus('Error checking USDC balance', 'error');
    }
}

// Update status message
function updateStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-text ${type}`;
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initialize();
    
    // Add event listeners
    refreshButton.addEventListener('click', refreshAllBalances);
    transferButton.addEventListener('click', transferUSDC);
    
    // Add developer balance refresh on double-click of developer wallet
    const devWalletElement = document.getElementById('devAddress');
    if (devWalletElement) {
        devWalletElement.addEventListener('dblclick', async () => {
            if (devWallet) {
                updateStatus('Manually refreshing developer balance', 'info');
                await refreshDeveloperBalance(devWallet);
                updateStatus('Developer balance refreshed!', 'success');
            }
        });
    }
    
    // Add User A USDC balance check on double-click of User A wallet
    const userAWalletElement = document.getElementById('userAAddress');
    if (userAWalletElement) {
        userAWalletElement.addEventListener('dblclick', async () => {
            if (userAWallet) {
                updateStatus('Checking User A USDC balance', 'info');
                await updateTransferButtonState();
                updateStatus('USDC balance check completed!', 'success');
            }
        });
    }
});

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    updateStatus(`Unexpected error: ${event.reason.message}`, 'error');
}); 