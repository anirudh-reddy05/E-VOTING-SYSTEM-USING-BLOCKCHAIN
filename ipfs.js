// Simple IPFS client using HTTP requests to Infura's IPFS gateway
class IPFSClient {
	constructor(options) {
		this.host = options.host || 'ipfs.infura.io';
		this.port = options.port || 5001;
		this.protocol = options.protocol || 'https';
		this.baseUrl = `${this.protocol}://${this.host}:${this.port}`;
	}

	// Add file to IPFS
	async add(file) {
		const formData = new FormData();
		formData.append('file', file);
		
		try {
			const response = await fetch(`${this.baseUrl}/api/v0/add`, {
				method: 'POST',
				body: formData,
			});
			const data = await response.json();
			return { path: data.Hash };
		} catch (error) {
			console.error('IPFS add error:', error);
			throw error;
		}
	}

	// Get file from IPFS
	async get(hash) {
		try {
			const response = await fetch(`${this.baseUrl}/api/v0/cat?arg=${hash}`);
			return await response.arrayBuffer();
		} catch (error) {
			console.error('IPFS get error:', error);
			throw error;
		}
	}
}

const ipfs = new IPFSClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
export default ipfs;