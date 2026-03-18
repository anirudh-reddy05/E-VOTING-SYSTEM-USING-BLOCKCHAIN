import web3 from './web3';
import ElectionFactory from './Build/ElectionFact.json';

/**
 * IMPORTANT: Contract Address Configuration
 * 
 * The ElectionFactory contract must be deployed before full blockchain functionality.
 * 
 * For development without blockchain:
 * - The app will work with limited functionality
 * - Mock addresses will be used for elections
 * 
 * To deploy the contract:
 * 1. Start Ganache: ganache-cli
 * 2. Run: cd Ethereum && node deploy.js
 * 3. Copy the contract address and update ELECTION_FACTORY_ADDRESS below
 * 4. Update ENABLE_BLOCKCHAIN to true
 * 
 * See BLOCKCHAIN_DEPLOYMENT_GUIDE.md for complete instructions
 */

// Get contract address from environment variable or use default
const ELECTION_FACTORY_ADDRESS = process.env.ELECTION_FACTORY_ADDRESS || '0xF5d3574DDc21D8Bd8bcB380de232cbbc8161234e';

// Set to false for development without blockchain
// Set to true when contract is deployed
const ENABLE_BLOCKCHAIN = process.env.ENABLE_BLOCKCHAIN === 'true' || false;

console.log('ElectionFactory Config:');
console.log(`  Address: ${ELECTION_FACTORY_ADDRESS}`);
console.log(`  Blockchain Enabled: ${ENABLE_BLOCKCHAIN}`);

// Mock implementation for development
const mockMethods = {
	createElection: () => ({
		send: async (options) => {
			const mockAddress = '0x' + Math.random().toString(16).slice(2, 42);
			console.log(`[MOCK] Election created at: ${mockAddress}`);
			return { options: { address: mockAddress } };
		}
	}),
	getDeployedElection: (email) => ({
		call: async (options) => {
			console.log(`[MOCK] Retrieved election for: ${email}`);
			return [
				'0x0000000000000000000000000000000000000000',
				'Mock Election',
				'Create an election.'
			];
		}
	})
};

// Try to use real contract, fallback to mock if not available
const instance = new web3.eth.Contract(
	ElectionFactory.abi,
	ELECTION_FACTORY_ADDRESS
);

// Wrap methods with error handling and mock fallback
const wrappedInstance = {
	methods: {
		createElection: (...args) => {
			try {
				return instance.methods.createElection(...args);
			} catch (e) {
				console.warn('Using MOCK: createElection (blockchain disabled)');
				return mockMethods.createElection(...args);
			}
		},
		getDeployedElection: (...args) => {
			try {
				return instance.methods.getDeployedElection(...args);
			} catch (e) {
				console.warn('Using MOCK: getDeployedElection (blockchain disabled)');
				return mockMethods.getDeployedElection(...args);
			}
		}
	},
	options: instance.options
};

export default wrappedInstance;