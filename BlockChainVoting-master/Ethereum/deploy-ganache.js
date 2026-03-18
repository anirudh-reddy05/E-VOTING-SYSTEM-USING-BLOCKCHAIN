const Web3 = require('web3');
const fs = require('fs-extra');
const path = require('path');

// Connect to Ganache
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));

const deployElectionFactory = async () => {
    try {
        // Get compiled contract
        const contractPath = path.resolve(__dirname, 'Build', 'ElectionFact.json');
        const contract = fs.readJsonSync(contractPath);
        
        // Get accounts from Ganache
        const accounts = await web3.eth.getAccounts();
        
        if (!accounts || accounts.length === 0) {
            console.error('❌ No accounts available. Make sure Ganache is running!');
            process.exit(1);
        }
        
        const deployerAccount = accounts[0];
        console.log('📦 Deploying ElectionFactory...');
        console.log(`👤 Deployer account: ${deployerAccount}`);
        
        // Get bytecode from different possible locations
        let bytecode = contract.evm?.bytecode?.object || contract.bytecode;
        if (!bytecode) {
            console.error('❌ Bytecode not found in contract JSON');
            process.exit(1);
        }
        
        // Ensure bytecode is prefixed with 0x
        if (!bytecode.startsWith('0x')) {
            bytecode = '0x' + bytecode;
        }
        
        // Create contract instance
        const ElectionFactory = new web3.eth.Contract(contract.abi);
        
        // Deploy contract
        const deployment = ElectionFactory.deploy({
            data: bytecode
        });
        
        // Estimate gas
        const gasEstimate = await deployment.estimateGas({ from: deployerAccount });
        console.log(`⛽ Estimated gas: ${gasEstimate}`);
        
        // Send transaction
        const tx = await deployment.send({
            from: deployerAccount,
            gas: Math.ceil(gasEstimate * 1.2), // Add 20% buffer
            gasPrice: '1000000000' // 1 Gwei
        });
        
        const contractAddress = tx.options.address;
        
        console.log('\n✅ ElectionFactory deployed successfully!');
        console.log(`📍 Contract Address: ${contractAddress}`);
        console.log('\n⚠️  UPDATE YOUR APPLICATION:');
        console.log('Update the ELECTION_FACTORY_ADDRESS in:');
        console.log('  1. .env file');
        console.log('  2. Ethereum/election_factory.js');
        console.log(`\nReplace with: ${contractAddress}\n`);
        
        // Save address to a file for reference
        fs.writeJsonSync(
            path.resolve(__dirname, 'deployed-contracts.json'),
            {
                network: 'ganache',
                timestamp: new Date().toISOString(),
                electionFactory: contractAddress
            },
            { spaces: 2 }
        );
        
        console.log('✅ Contract address saved to Ethereum/deployed-contracts.json');
        
    } catch (error) {
        console.error('❌ Deployment failed:');
        console.error(error.message);
        process.exit(1);
    }
};

deployElectionFactory();
