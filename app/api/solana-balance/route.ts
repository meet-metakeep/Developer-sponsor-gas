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
    
    console.log(`Getting Solana balance for address: ${address}`)
    
    // Use RPC call 
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com"
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address.trim()]
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

    // Convert lamports to SOL
    const lamports = data.result.value
    const solBalance = (lamports / 1000000000).toFixed(5) // 1 SOL = 1,000,000,000 lamports
    
    console.log(`Balance retrieved: ${solBalance} SOL`)
    
    return NextResponse.json({
      status: 'SUCCESS',
      balance: solBalance
    })
    
  } catch (error) {
    console.error('Error getting Solana balance:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get Solana balance',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'ERROR'
      },
      { status: 500 }
    )
  }
} 