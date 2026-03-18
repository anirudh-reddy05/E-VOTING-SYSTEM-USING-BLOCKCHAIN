/**
 * Mock ElectionFactory for development/testing without blockchain
 * Replace this with actual deployed contract address when ready
 */

const mockElections = {};

export default {
	methods: {
		createElection: (email, name, description) => ({
			send: async (options) => {
				// Mock contract deployment
				const mockAddress = '0x' + Math.random().toString(16).slice(2, 42);
				mockElections[email] = {
					address: mockAddress,
					name: name,
					description: description,
					candidates: [],
					voters: {}
				};
				return { options: { address: mockAddress } };
			}
		}),
		getDeployedElection: (email) => ({
			call: async (options) => {
				const election = mockElections[email];
				if (!election) {
					return [
						'0x0000000000000000000000000000000000000000',
						'',
						'Create an election.'
					];
				}
				return [
					election.address,
					election.name,
					election.description
				];
			}
		})
	},
	options: {
		address: '0xMockFactory'
	}
};
