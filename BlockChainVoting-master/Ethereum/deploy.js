const Web3 = require('web3');
const fs = require('fs-extra');
const path = require('path');

// Configure for Ganache local blockchain
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));

const deploy = async () => {
	try {
		console.log('Attempting to deploy ElectionFactory contract...\n');
		
		const accounts = await web3.eth.getAccounts();
		
		if (!accounts || accounts.length === 0) {
			console.error('❌ No accounts available. Make sure Ganache is running on http://127.0.0.1:8545');
			process.exit(1);
		}
		
		console.log(`✅ Connected to Ganache`);
		console.log(`👤 Deploying from account: ${accounts[0]}\n`);
		
		// Load compiled contract
		const contractPath = path.resolve(__dirname, 'Build', 'ElectionFact.json');
		const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
		
		// Get bytecode
		const bytecode = contractJSON.evm?.bytecode?.object || contractJSON.bytecode;
		if (!bytecode) {
			throw new Error('Bytecode not found in compiled contract');
		}
		
		const byteCodeWithPrefix = bytecode.startsWith('0x') ? bytecode : '0x' + bytecode;
		
		console.log(`📋 Contract ABI loaded with ${contractJSON.abi.length} methods`);
		console.log(`📦 Bytecode size: ${byteCodeWithPrefix.length / 2} bytes\n`);
		
		// Create contract instance
		const ElectionFactory = new web3.eth.Contract(contractJSON.abi);
		
		// Estimate gas
		console.log('⛽ Estimating gas...');
		const gasEstimate = await ElectionFactory.deploy({
			data: byteCodeWithPrefix
		}).estimateGas({ from: accounts[0] });
		
		const gasWithBuffer = Math.ceil(gasEstimate * 1.5);
		console.log(`   Estimated: ${gasEstimate}`);
		console.log(`   With buffer: ${gasWithBuffer}\n`);
		
		// Deploy
		console.log('🚀 Deploying contract...');
		const result = await ElectionFactory.deploy({
			data: byteCodeWithPrefix
		}).send({
			from: accounts[0],
			gas: gasWithBuffer,
			gasPrice: await web3.eth.getGasPrice()
		});
		
		const contractAddress = result.options.address;
		
		console.log('\n✅ SUCCESS! Contract deployed!\n');
		console.log(`📍 Contract Address: ${contractAddress}`);
		console.log(`🔗 View on: http://localhost:8545\n`);
		
		// Save to file
		const deploymentInfo = {
			network: 'ganache',
			timestamp: new Date().toISOString(),
			contractAddress: contractAddress,
			transactionHash: result.transactionHash,
			blockNumber: result.blockNumber,
			deployer: accounts[0]
		};
		
		fs.writeJsonSync(
			path.resolve(__dirname, 'deployed-contracts.json'),
			deploymentInfo,
			{ spaces: 2 }
		);
		
		console.log('📁 Deployment info saved to: Ethereum/deployed-contracts.json\n');
		
		console.log('⚡ NEXT STEPS:');
		console.log(`1. Update .env file:`);
		console.log(`   ELECTION_FACTORY_ADDRESS=${contractAddress}\n`);
		console.log(`2. Update Ethereum/election_factory.js with the address\n`);
		console.log(`3. Restart the application: node server.js\n`);
		
		process.exit(0);
	} catch (error) {
		console.error('\n❌ DEPLOYMENT FAILED\n');
		console.error(`Error: ${error.message}`);
		if (error.data) console.error(`Data: ${error.data}`);
		console.error('\nTroubleshooting:');
		console.error('1. Ensure Ganache is running: ganache-cli');
		console.error('2. Ganache should be on http://127.0.0.1:8545');
		console.error('3. Check gas limit and gas price');
		process.exit(1);
	}
};

deploy();
