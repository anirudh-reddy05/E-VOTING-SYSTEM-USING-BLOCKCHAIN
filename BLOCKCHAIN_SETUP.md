# Blockchain Setup Guide for BlockChain Voting

## Overview
This guide will help you set up and deploy the smart contracts for the BlockChain Voting application.

## Prerequisites

1. **Node.js** (v12 or higher)
2. **npm** or **yarn**
3. **MetaMask** browser extension installed
4. **Rinkeby Test ETH** (for Rinkeby testnet)
5. **Truffle** (optional, for advanced deployment)

## Quick Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including `solc` (Solidity compiler) and `web3`.

### Step 2: Compile Smart Contracts

```bash
node Ethereum/compile.js
```

This compiles the Solidity contracts and generates the ABI files in `Ethereum/Build/`:
- `Election.json` - Individual election contract
- `ElectionFact.json` - Factory contract for managing multiple elections

### Step 3: Deploy to Rinkeby Testnet

#### Option A: Using Infura with Private Keys (Recommended)

Create a file `Ethereum/deploy-rinkeby.js`:

```javascript
const assert = require('assert');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const eF = require('./Build/ElectionFact.json');

const PRIVATE_KEY = process.env.PRIVATE_KEY; // Your MetaMask private key
const INFURA_URL = 'https://rinkeby.infura.io/v3/29bcae4ee7454a118a2b0f0f4d86c0e0';

if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable not set');
}

const provider = new HDWalletProvider(PRIVATE_KEY, INFURA_URL);
const web3 = new Web3(provider);

const deploy = async () => {
    try {
        const accounts = await web3.eth.getAccounts();
        console.log('Deploying from account:', accounts[0]);
        
        const contract = new web3.eth.Contract(JSON.parse(eF.interface));
        
        const result = await contract
            .deploy({ 
                data: '0x' + eF.bytecode,
                arguments: [accounts[0], "Election Factory", "Main factory for elections"]
            })
            .send({ 
                gas: '3000000', 
                from: accounts[0],
                gasPrice: '20000000000' // 20 Gwei
            });

        console.log('✓ Contract deployed successfully!');
        console.log('Contract Address:', result.options.address);
        console.log('\n⚠️  UPDATE Ethereum/election_factory.js with this address:');
        console.log(`const instance = new web3.eth.Contract(\n\tJSON.parse(ElectionFactory.interface),\n\t'${result.options.address}'\n);`);
        
        provider.engine.stop();
        process.exit(0);
    } catch (error) {
        console.error('Deployment failed:', error.message);
        provider.engine.stop();
        process.exit(1);
    }
};

deploy();
```

Run deployment with:

```bash
# Set your private key (WITHOUT 0x prefix)
export PRIVATE_KEY="your_private_key_here"
node Ethereum/deploy-rinkeby.js
```

**How to get your Private Key:**
1. Open MetaMask
2. Click account menu → Settings → Security & Privacy
3. Click "Reveal Secret Recovery Phrase" or similar
4. Export private key for the account (usually starts with 0x, remove it)

#### Option B: Using Ganache (Local Testing)

1. Install Ganache CLI:
```bash
npm install -g ganache-cli
```

2. Start Ganache:
```bash
ganache-cli
```

3. Update `Ethereum/election_factory.js` to use local address:
```javascript
const instance = new web3.eth.Contract(
    JSON.parse(ElectionFactory.interface),
    'LOCAL_CONTRACT_ADDRESS_FROM_GANACHE'
);
```

4. Update `Ethereum/web3.js` to use Ganache:
```javascript
const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
web3 = new Web3(provider);
```

### Step 4: Update Contract Address

After deployment, copy the contract address and update `Ethereum/election_factory.js`:

```javascript
const instance = new web3.eth.Contract(
    JSON.parse(ElectionFactory.interface),
    'YOUR_DEPLOYED_CONTRACT_ADDRESS'
);
```

## Troubleshooting

### Error: "Returned values aren't valid, did it run Out of Gas?"

**Causes:**
1. Contract ABI is incorrect or missing
2. Contract address doesn't have the code deployed
3. Function signature doesn't match ABI
4. Network mismatch (using Rinkeby in code but Ganache locally)

**Solutions:**
- Verify contract is deployed: Use Etherscan (https://rinkeby.etherscan.io) to check if contract address has code
- Check ABI: Ensure `Ethereum/Build/Election.json` and `ElectionFact.json` exist and are valid JSON
- Verify network: Ensure MetaMask is connected to the same network as your contract
- Increase gas: Try increasing gas limit in `.send()` calls

### Error: "No blockchain accounts found"

**Causes:**
1. MetaMask not installed
2. MetaMask not connected to website
3. Web3 provider not initialized

**Solutions:**
- Install MetaMask browser extension
- Click MetaMask icon and connect to the website
- Ensure you're using a supported browser (Chrome, Firefox, Edge)

### Error: "Private key not found"

**Causes:**
1. PRIVATE_KEY environment variable not set
2. Invalid private key format

**Solutions:**
```bash
# On Windows (PowerShell)
$env:PRIVATE_KEY="your_key_here"

# On macOS/Linux
export PRIVATE_KEY="your_key_here"
```

### Contract doesn't exist at address

**Solutions:**
1. Verify you're on the correct network (Rinkeby for Infura)
2. Re-deploy the contract
3. Check Etherscan for the address (https://rinkeby.etherscan.io)

## Network Configuration

### Current Configuration
- **Network**: Rinkeby Testnet
- **Provider**: Infura
- **RPC URL**: https://rinkeby.infura.io/v3/YOUR_API_KEY
- **Chain ID**: 4

### Getting Rinkeby ETH
1. Go to https://rinkeyby-faucet.allthatnode.com or https://faucet.rinkeby.io
2. Connect your MetaMask wallet
3. Request testnet ETH (you'll receive 0.1 - 1 ETH)

## Testing

After deployment, test the contract:

1. Start the development server:
```bash
npm run dev
```

2. Login as a company
3. Create an election
4. Check console for contract calls and responses
5. Verify election appears in dashboard

## Files Modified During Setup

- `Ethereum/election_factory.js` - Update contract address after deployment
- `Ethereum/web3.js` - May need to update for different networks
- `.env` or environment variables - Store sensitive keys

## Next Steps

1. Deploy contracts to Rinkeby
2. Update contract addresses
3. Test election creation
4. Test voting functionality
5. Deploy to production blockchain

## Security Notes

⚠️ **IMPORTANT**:
- Never commit private keys to git
- Use environment variables for sensitive data
- Use a hardware wallet for production  
- Test thoroughly on testnet before mainnet
- Always verify contract addresses on block explorers

## Support

For more information:
- Solidity Docs: https://solidity.readthedocs.io
- Web3.js Docs: https://web3js.readthedocs.io
- Infura: https://infura.io
- Rinkeby Faucet: https://faucet.rinkeby.io
