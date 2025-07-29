import { useState } from 'react'

interface Balance {
  sol: string
  usdc: string
}

interface Balances {
  userA: Balance | null
  userB: Balance | null
  dev: Balance | null
}

export function useWalletBalances() {
  const [balances, setBalances] = useState<Balances>({
    userA: null,
    userB: null,
    dev: null
  })

  const fetchSolBalance = async (address: string): Promise<string> => {
    try {
      const response = await fetch('/api/solana-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.status === 'SUCCESS' && data.balance) {
        return `${data.balance} SOL`
      } else {
        throw new Error(data.error || 'Invalid balance response')
      }
    } catch (error) {
      console.error(`Error fetching SOL balance for ${address}:`, error)
      return 'Error'
    }
  }

  const fetchUSDCBalance = async (address: string): Promise<string> => {
    try {
      const response = await fetch('/api/usdc-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.status === 'SUCCESS' && data.balance) {
        return `${data.balance} USDC`
      } else {
        throw new Error(data.error || 'Invalid USDC balance response')
      }
    } catch (error) {
      console.error(`Error fetching USDC balance for ${address}:`, error)
      return 'Error'
    }
  }

  const refreshBalances = async (userAWallet?: string, userBWallet?: string, devWallet?: string) => {
    try {
      console.log('Refreshing balances...')
      
      // Only use provided wallet addresses - no hardcoded fallbacks
      if (!userAWallet || !userBWallet || !devWallet) {
        console.log('Some wallet addresses are missing, skipping balance refresh')
        return
      }
      
      console.log('Using wallet addresses:', { userAWallet, userBWallet, devWallet })
      
      // Set loading state
      setBalances({
        userA: { sol: 'Loading...', usdc: 'Loading...' },
        userB: { sol: 'Loading...', usdc: 'Loading...' },
        dev: { sol: 'Loading...', usdc: 'Loading...' }
      })
      
      // Fetch balances in parallel
      const [userASol, userBSol, devSol, userAUsdc, userBUsdc, devUsdc] = await Promise.all([
        fetchSolBalance(userAWallet),
        fetchSolBalance(userBWallet),
        fetchSolBalance(devWallet),
        fetchUSDCBalance(userAWallet),
        fetchUSDCBalance(userBWallet),
        fetchUSDCBalance(devWallet)
      ])
      
      setBalances({
        userA: { sol: userASol, usdc: userAUsdc },
        userB: { sol: userBSol, usdc: userBUsdc },
        dev: { sol: devSol, usdc: devUsdc }
      })
      
      console.log('Balances refreshed successfully')
    } catch (error) {
      console.error('Error refreshing balances:', error)
      throw error
    }
  }

  return {
    balances,
    refreshBalances
  }
} 