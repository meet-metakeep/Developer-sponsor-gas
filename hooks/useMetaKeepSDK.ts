import { useState } from 'react'

declare global {
  interface Window {
    MetaKeep: any
  }
}

export function useMetaKeepSDK() {
  const [sdk, setSdk] = useState<any>(null)
  const [userAWallet, setUserAWallet] = useState<string>('')
  const [userBWallet, setUserBWallet] = useState<string>('')
  const [devWallet, setDevWallet] = useState<string>('')
  const [isInitializing, setIsInitializing] = useState<boolean>(false)

  const initializeWallets = async () => {
    try {
      setIsInitializing(true)
      
      // Initialize MetaKeep SDK
      if (typeof window !== 'undefined' && window.MetaKeep) {
        const metaKeepSDK = new window.MetaKeep({
          appId: process.env.NEXT_PUBLIC_METAKEEP_APP_ID || "12e48311-ebfb-4776-9b57-39e47533757a"
        })
        setSdk(metaKeepSDK)

        // Set User B wallet from environment variable
        setUserBWallet(process.env.NEXT_PUBLIC_USER_B_WALLET || "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV")

        // Get developer wallet from API
        try {
          const devResponse = await fetch('/api/developer-wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          const devData = await devResponse.json()
          if (devData.status === 'SUCCESS' && devData.wallet?.solAddress) {
            setDevWallet(devData.wallet.solAddress)
            console.log('Developer wallet set:', devData.wallet.solAddress)
          }
        } catch (devError) {
          console.warn('Developer wallet fetch failed, using fallback:', devError)
          
        }

        // Try to get User A wallet, but don't fail if it requires email
        try {
          console.log('Attempting to get User A wallet from MetaKeep...')
          const userAResponse = await metaKeepSDK.getWallet()
          console.log('MetaKeep getWallet response:', userAResponse)
          
          if (userAResponse?.status === 'SUCCESS' && userAResponse.wallet?.solAddress) {
            setUserAWallet(userAResponse.wallet.solAddress)
            console.log('User A wallet set:', userAResponse.wallet.solAddress)
          } else if (userAResponse?.status === 'OPERATION_CANCELLED') {
            // User cancelled or needs to provide email - this is normal
            console.log('MetaKeep wallet initialization requires user interaction')
            // Don't throw error, just log it
          } else {
            console.log('MetaKeep getWallet returned unexpected status:', userAResponse?.status)
          }
        } catch (walletError: any) {
          if (walletError?.status === 'OPERATION_CANCELLED') {
            console.log('MetaKeep wallet initialization cancelled by user')
            // This is normal behavior, don't treat as error
          } else {
            console.warn('MetaKeep wallet initialization failed:', walletError)
            // Don't throw error, just log it
          }
        }
      } else {
        console.warn('MetaKeep SDK not available')
      }
    } catch (error) {
      console.error('Error in wallet initialization:', error)
      // Re-throw critical errors that should stop initialization
      if (error instanceof Error && !error.message.includes('OPERATION_CANCELLED')) {
        throw error
      }
    } finally {
      setIsInitializing(false)
    }
  }

  return {
    sdk,
    userAWallet,
    userBWallet,
    devWallet,
    isInitializing,
    initializeWallets
  }
} 