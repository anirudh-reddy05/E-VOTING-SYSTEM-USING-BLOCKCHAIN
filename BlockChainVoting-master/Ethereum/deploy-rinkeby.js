const assert = require('assert');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const eF = require('./Build/ElectionFact.json');

// Get private key from environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const INFURA_URL = 'https://rinkeby.infura.io/v3/29bcae4ee7454a118a2b0f0f4d86c0e0';

if (!PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY environment variable not set');
    console.error('Set it using:');
    console.error('  Windows (PowerShell): $env:PRIVATE_KEY="your_key_here"');
    console.error('  macOS/Linux: export PRIVATE_KEY="your_key_here"');
    process.exit(1);
}

if (!PRIVATE_KEY.startsWith('0x')) {
    console.warn('⚠️  Note: Private key should not include 0x prefix');
    console.warn('Using key without 0x prefix');
}

const provider = new HDWalletProvider(PRIVATE_KEY, INFURA_URL);
const web3 = new Web3(provider);

const deploy = async () => {
    try {
        console.log('🚀 Starting deployment to Rinkeby testnet...\n');
        
        const accounts = await web3.eth.getAccounts();
        console.log('📝 Deploying from account:', accounts[0]);
        
        const balance = await web3.eth.getBalance(accounts[0]);
        const balanceInEth = web3.utils.fromWei(balance, 'ether');
        console.log('💰 Account balance:', balanceInEth, 'ETH\n');
        
        if (parseFloat(balanceInEth) < 0.1) {
            console.warn('⚠️  Warning: Low balance. You may need more ETH for gas.');
            console.warn('Get test ETH from: https://faucet.rinkeby.io\n');
        }
        
        console.log('📦 Creating contract instance...');
        const contract = new web3.eth.Contract(JSON.parse(eF.interface));
        
        console.log('⏳ Deploying contract (this may take a minute)...\n');
        
        const result = await contract
            .deploy({ 
                data: '0x' + eF.bytecode,
                arguments: [accounts[0], "Election Factory", "Factory for managing elections"]
            })
            .send({ 
                gas: '3000000', 
                from: accounts[0],
                gasPrice: '20000000000' // 20 Gwei
            });

        console.log('✅ Contract deployed successfully!\n');
        console.log('═════════════════════════════════════════');
        console.log('Contract Address:', result.options.address);
        console.log('═════════════════════════════════════════\n');
        
        console.log('📋 Next Steps:');
        console.log('1. Copy the contract address above');
        console.log('2. Open Ethereum/election_factory.js');
        console.log('3. Replace the old contract address with:');
        console.log(`   '${result.options.address}'\n`);
        
        console.log('🔍 Verify on Etherscan:');
        console.log(`   https://rinkeby.etherscan.io/address/${result.options.address}\n`);
        
        console.log('📚 Full Example for election_factory.js:');
        console.log('────────────────────────────────────────');
        console.log('const instance = new web3.eth.Contract(');
        console.log('    JSON.parse(ElectionFactory.interface),');
        console.log(`    '${result.options.address}'`);
        console.log(');');
        console.log('────────────────────────────────────────\n');
        
        provider.engine.stop();
        
        console.log('✓ Deployment complete! Ready to use.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Deployment failed:');
        console.error('Error:', error.message);
        
        if (error.message.includes('insufficient funds')) {
            console.error('\n💡 You need more test ETH for gas fees.');
            console.error('Get some from: https://faucet.rinkeby.io');
        }
        
        if (error.message.includes('invalid private key')) {
            console.error('\n💡 Invalid private key format.');
            console.error('Make sure you copied it correctly without the 0x prefix');
        }
        
        provider.engine.stop();
        process.exit(1);
    }
};

deploy();
