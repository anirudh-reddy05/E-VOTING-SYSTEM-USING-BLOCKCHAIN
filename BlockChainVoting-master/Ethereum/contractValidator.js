import web3 from './web3';

/**
 * Validates if a contract exists at the given address
 * @param {string} address - Contract address to validate
 * @returns {Promise<boolean>} - True if contract exists, false otherwise
 */
export async function contractExists(address) {
    try {
        const code = await web3.eth.getCode(address);
        // A contract exists if the code is not '0x' (empty)
        return code !== '0x' && code !== '0x0';
    } catch (error) {
        console.error('Error checking contract existence:', error);
        return false;
    }
}

/**
 * Safe wrapper for contract method calls with better error handling
 * @param {object} contract - Web3 contract instance
 * @param {string} methodName - Name of the method to call
 * @param {array} args - Arguments for the method
 * @param {object} options - Call options
 * @returns {Promise} - Result of the method call
 */
export async function safeContractCall(contract, methodName, args = [], options = {}) {
    try {
        // Validate contract code exists
        const code = await web3.eth.getCode(contract.options.address);
        if (code === '0x' || code === '0x0') {
            throw new Error(`No contract found at address ${contract.options.address}`);
        }
        
        // Call the method
        const method = contract.methods[methodName];
        if (!method) {
            throw new Error(`Method ${methodName} does not exist on contract`);
        }
        
        const result = await method(...args).call(options);
        return result;
    } catch (error) {
        console.error(`Error calling ${methodName}:`, error);
        throw error;
    }
}

export default {
    contractExists,
    safeContractCall
};
