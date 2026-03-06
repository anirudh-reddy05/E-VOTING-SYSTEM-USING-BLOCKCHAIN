# Blockchain Setup Guide

## Overview
This application is a blockchain-based E-voting system that stores elections and votes on the Ethereum blockchain.

## Current Configuration

The application is configured to use the **Sepolia Testnet** (via Infura).

**Current Settings:**
- Network: Sepolia Testnet
- Provider: Infura API
- ElectionFactory Contract Address: `0xF5d3574DDc21D8Bd8bcB380de232cbbc8161234e`

## Issues You May Encounter

### Error: "Returned values aren't valid, did it run Out of Gas?"

This error typically means:
1. **Contract not deployed** - The contract doesn't exist at the address
2. **Wrong network** - The contract was deployed on a different network
3. **Network not synced** - The blockchain node is not fully synced
4. **Invalid ABI** - The ABI doesn't match the deployed contract

## Solutions

### Option 1: Use Local Ganache (Recommended for Development)

1. **Install Ganache CLI:**
```bash
npm install -g ganache-cli
```

2. **Start Ganache:**
```bash
ganache-cli
```
This runs a local blockchain on `http://127.0.0.1:8545`

3. **Update web3.js configuration:**
Edit `/Ethereum/web3.js` and change:
```javascript
const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
```

4. **Deploy contract to Ganache:**
```bash
cd Ethereum
node deploy.js
```
This will output the contract address. Update the address in `election_factory.js`.

5. **Update election_factory.js:**
Replace the hardcoded address with the address from step 4.

### Option 2: Deploy to Sepolia Testnet

1. **Get Sepolia Test ETH:**
   - Visit a faucet: https://sepoliafaucet.com/ or https://www.quicknode.com/faucet/ethereum-sepolia

2. **Deploy using Truffle or Hardhat:**
   - Configure your deployment script with your private key
   - Deploy to Sepolia
   - Update the contract address in `election_factory.js`

3. **Update election_factory.js:**
```javascript
const instance = new web3.eth.Contract(
    ElectionFactory.abi,
    'YOUR_DEPLOYED_CONTRACT_ADDRESS'  // Replace with actual address
);
```

### Option 3: Disable Blockchain (Mock Mode)

For development without actual blockchain functionality, you can modify the pages to use mock/localStorage data instead of smart contracts.

## Files to Modify

- `/Ethereum/web3.js` - Network configuration
- `/Ethereum/election_factory.js` - Factory contract address
- `/pages/election/create_election.js` - Election creation logic
- `/pages/company_login.js` - Company login blockchain checks
- `/pages/election/vote.js` - Voting logic

## Testing the Setup

1. Start the application: `node server.js`
2. Try to create an election (if contract is deployed)
3. Check browser console for detailed error messages
4. Check network tab to see actual API calls

## Debugging

**Enable verbose logging:**
- Open Browser DevTools (F12)
- Check Console tab for detailed error messages
- Look for blockchain-related errors with full stack traces

**Verify contract deployment:**
```javascript
// In browser console:
const code = await web3.eth.getCode('0x...contract_address...');
console.log(code); // Should not be '0x0x'
```

## Security Notes

- Never commit private keys to version control
- Use environment variables for sensitive data (.env file)
- The .env file is already in .gitignore
- Always use testnet for development, not mainnet

## Support

For more information:
- Truffle Docs: https://truffle.build
- Hardhat Docs: https://hardhat.org
- Web3.js Docs: https://web3js.readthedocs.io
- Sepolia Testnet: https://sepolia.etherscan.io
