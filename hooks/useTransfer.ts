import { useState } from 'react'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction } from '@solana/spl-token'

interface TransferState {
  isTransferring: boolean
  error: string | null
  success: boolean
}

export function useTransfer() {
  const [transferState, setTransferState] = useState<TransferState>({
    isTransferring: false,
    error: null,
    success: false
  })

  const transferUSDC = async (
    connection: Connection,
    sdk: any,
    userAWallet: string,
    userBWallet: string,
    devWallet: string,
    amount: number = Number(process.env.NEXT_PUBLIC_TRANSFER_AMOUNT) || 0.01
  ) => {
    setTransferState({
      isTransferring: true,
      error: null,
      success: false
    })

    try {
      console.log('Starting USDC transfer...')
      console.log('Transfer details:', {
        from: userAWallet,
        to: userBWallet,
        amount,
        devWallet
      })

      // USDC mint address for devnet
      const usdcMint = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT_DEVNET || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
      
      // Get associated token addresses
      const userAATA = await getAssociatedTokenAddress(usdcMint, new PublicKey(userAWallet))
      const userBATA = await getAssociatedTokenAddress(usdcMint, new PublicKey(userBWallet))
      
      console.log('Token accounts:', {
        userAATA: userAATA.toString(),
        userBATA: userBATA.toString()
      })

      // Check if User B has an associated token account
      const userBATAInfo = await connection.getAccountInfo(userBATA)
      if (!userBATAInfo) {
        console.log('User B does not have USDC token account, creating one...')
        // Create ATA for User B (this will be paid by the developer)
        const createATAInstruction = await createAssociatedTokenAccountInstruction(
          new PublicKey(devWallet), // payer
          userBATA, // associated token account
          new PublicKey(userBWallet), // owner
          usdcMint // mint
        )
        
        // Add create ATA instruction to transaction
        const transaction = new Transaction()
        transaction.add(createATAInstruction)
        
        // Sign with developer wallet
        const createResponse = await fetch('/api/metakeep-sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
            walletId: 'master'
          })
        })
        
        if (!createResponse.ok) {
          throw new Error('Failed to create User B token account')
        }
        
        console.log('User B token account created successfully')
      }

      // Create transfer instruction
      const transferAmount = Math.floor(amount * 1e6) // Convert to USDC decimals (6)
      const transferInstruction = createTransferInstruction(
        userAATA, // source
        userBATA, // destination
        new PublicKey(userAWallet), // owner
        transferAmount // amount
      )

      // Create transaction
      const transaction = new Transaction()
      transaction.add(transferInstruction)
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = new PublicKey(devWallet)

      console.log('Transaction created, getting user signature...')

      // Get user signature using MetaKeep SDK
      const userSignature = await sdk.signTransaction(
        transaction,
        `Transfer ${amount} USDC to User B`
      )
      
      if (!userSignature) {
        throw new Error('User signature not obtained')
      }

      console.log('User signature obtained, getting developer signature...')

      // Convert hex signature to Uint8Array
      const hexToUint8Array = (hex: string) => {
        const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
        const bytes = new Uint8Array(cleanHex.length / 2);
        for (let i = 0; i < cleanHex.length; i += 2) {
          bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
        }
        return bytes;
      };

      // Add the user's signature to the transaction
      transaction.addSignature(
        new PublicKey(userAWallet),
        Buffer.from(hexToUint8Array(userSignature.signature))
      );

      // Serialize the transaction message for MetaKeep API
      const serializedMessage = transaction.serializeMessage();
      const serializedMessageHex = '0x' + Array.from(serializedMessage).map(b => b.toString(16).padStart(2, '0')).join('');

      console.log('Serialized transaction message length:', serializedMessage.length);

      // Prepare the API request in the correct format for MetaKeep
      const apiRequest = {
        transactionObject: {
          serializedTransactionMessage: serializedMessageHex
        },
        reason: "Developer gas sponsorship for USDC transfer"
      };

      console.log('MetaKeep Developer Sign API Request:', JSON.stringify(apiRequest, null, 2));

      // Call MetaKeep API to sign with developer wallet
      const devResponse = await fetch('/api/metakeep-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiRequest)
      });

      const devSignature = await devResponse.json();
      console.log('MetaKeep Developer Sign API Response:', devSignature);

      if (!devResponse.ok || devSignature.status !== 'SUCCESS') {
        throw new Error(`Developer signing failed: ${devSignature.message || devSignature.error || 'Unknown error'}`);
      }

      // Add developer signature to the transaction
      const devSignatureBytes = hexToUint8Array(devSignature.signature);
      transaction.addSignature(
        new PublicKey(devWallet),
        Buffer.from(devSignatureBytes)
      );

      console.log('Transaction fully signed. Submitting to network...');

      // Submit the fully signed transaction
      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      console.log('Transaction submitted:', signature);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log('Transaction confirmed successfully!')
      
      setTransferState({
        isTransferring: false,
        error: null,
        success: true
      })

      return {
        signature,
        success: true,
        userSignature,
        developerSignature: devSignature
      }

    } catch (error) {
      console.error('Transfer error:', error)
      setTransferState({
        isTransferring: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      })
      
      throw error
    }
  }

  return {
    transferUSDC,
    transferState
  }
} 