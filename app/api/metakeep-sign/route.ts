import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Proxying MetaKeep developer signing request:', JSON.stringify(body, null, 2))
    
    const response = await fetch('https://api.metakeep.xyz/v2/app/sign/transaction', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': process.env.METAKEEP_API_KEY || ''
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('MetaKeep API error:', response.status, errorText)
      throw new Error(`MetaKeep API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('MetaKeep developer signing response:', JSON.stringify(data, null, 2))
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in MetaKeep developer signing proxy:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sign transaction with MetaKeep',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 