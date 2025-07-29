import { useState } from 'react'

declare global {
  interface Window {
    solanaWeb3: any
  }
}

export function useSolanaConnection() {
  const [connection, setConnection] = useState<any>(null)

  const initializeConnection = async () => {
    try {
      if (typeof window !== 'undefined' && window.solanaWeb3) {
        const solanaConnection = new window.solanaWeb3.Connection(
          process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com",
          'confirmed'
        )
        setConnection(solanaConnection)
        
        // Test connection
        const version = await solanaConnection.getVersion()
        console.log('Solana connection established. Version:', version)
      }
    } catch (error) {
      console.error('Error initializing Solana connection:', error)
      throw error
    }
  }

  return {
    connection,
    initializeConnection
  }
} 