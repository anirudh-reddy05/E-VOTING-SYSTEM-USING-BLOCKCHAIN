import Web3 from 'web3';

let web3;

if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
	console.log(window.ethereum.enable());
	web3 = new Web3(window.web3.currentProvider);
	console.log('Web3: ', web3);
} else {
	// Using local Ganache blockchain for development (http://127.0.0.1:8545)
	// For production, change to: https://sepolia.infura.io/v3/29bcae4ee7454a118a2b0f0f4d86c0e0
	const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
	web3 = new Web3(provider);
	console.log('Web3 else: ', web3);
}

export default web3;
