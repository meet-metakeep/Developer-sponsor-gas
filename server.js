const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

// Validate required environment variables
const requiredEnvVars = ['METAKEEP_API_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

// Enable CORS
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Proxy endpoint for MetaKeep developer wallet API
app.post('/api/developer-wallet', async (req, res) => {
    try {
        const response = await fetch('https://api.metakeep.xyz/v3/getDeveloperWallet', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'x-api-key': process.env.METAKEEP_API_KEY
            },
            body: JSON.stringify({
                "id": "master"
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching developer wallet:', error);
        res.status(500).json({ 
            error: 'Failed to fetch developer wallet',
            details: error.message 
        });
    }
});

// Proxy endpoint for MetaKeep developer signing API
app.post('/api/metakeep-sign', async (req, res) => {
    try {
        console.log('Proxying MetaKeep developer signing request:', JSON.stringify(req.body, null, 2));
        
        const response = await fetch('https://api.metakeep.xyz/v2/app/sign/transaction', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'x-api-key': process.env.METAKEEP_API_KEY
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('MetaKeep API error:', response.status, errorText);
            throw new Error(`MetaKeep API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('MetaKeep developer signing response:', JSON.stringify(data, null, 2));
        res.json(data);
    } catch (error) {
        console.error('Error in MetaKeep developer signing proxy:', error);
        res.status(500).json({ 
            error: 'Failed to sign transaction with MetaKeep',
            details: error.message 
        });
    }
});

// Proxy endpoint for Solana CLI balance check
app.post('/api/solana-balance', async (req, res) => {
    try {
        const { address } = req.body;
        
        if (!address) {
            return res.status(400).json({ 
                error: 'Address is required',
                status: 'ERROR'
            });
        }
        
        console.log(`Getting Solana balance for address: ${address}`);
        
        // Execute Solana CLI command
        const command = `solana balance ${address} -u devnet`;
        console.log(`Executing CLI command: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr) {
            console.error('Solana CLI stderr:', stderr);
        }
        
        // Parse the balance from stdout (format: "0.49997 SOL")
        const balanceMatch = stdout.trim().match(/^([\d.]+)\s+SOL$/);
        
        if (balanceMatch) {
            const balance = balanceMatch[1];
            console.log(`Balance retrieved: ${balance} SOL`);
            res.json({
                status: 'SUCCESS',
                balance: balance
            });
        } else {
            throw new Error(`Failed to parse balance from output: ${stdout}`);
        }
        
    } catch (error) {
        console.error('Error getting Solana balance:', error);
        res.status(500).json({ 
            error: 'Failed to get Solana balance',
            details: error.message,
            status: 'ERROR'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Environment variables loaded successfully');
}); 