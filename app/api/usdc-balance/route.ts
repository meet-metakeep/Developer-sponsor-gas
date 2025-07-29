import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()
    
    if (!address) {
      return NextResponse.json(
        { 
          error: 'Address is required',
          status: 'ERROR'
        },
        { status: 400 }
      )
    }
    
    // More permissive Solana address validation
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address.trim())) {
      console.error('Invalid address format:', address)
      return NextResponse.json(
        { 
          error: 'Invalid Solana address format',
          status: 'ERROR'
        },
        { status: 400 }
      )
    }
    
    console.log(`Getting USDC balance for address: ${address}`)
    
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com"
    const usdcMint = process.env.NEXT_PUBLIC_USDC_MINT_DEVNET || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
    
    // Get token accounts for the address
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          address.trim(),
          {
            mint: usdcMint
          },
          {
            encoding: 'jsonParsed'
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`RPC request failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.error) {
      console.error('RPC error details:', data.error)
      throw new Error(`RPC error: ${data.error.message || 'Unknown RPC error'}`)
    }

    // Calculate total USDC balance
    let totalBalance = 0
    if (data.result && data.result.value) {
      for (const account of data.result.value) {
        const balance = account.account.data.parsed.info.tokenAmount.uiAmount
        totalBalance += balance || 0
      }
    }
    
    const usdcBalance = totalBalance.toFixed(2)
    console.log(`USDC balance retrieved: ${usdcBalance} USDC`)
    
    return NextResponse.json({
      status: 'SUCCESS',
      balance: usdcBalance
    })
    
  } catch (error) {
    console.error('Error getting USDC balance:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get USDC balance',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'ERROR'
      },
      { status: 500 }
    )
  }
} 