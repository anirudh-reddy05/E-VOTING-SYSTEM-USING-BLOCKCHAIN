const fs = require('fs');
const path = require('path');

const contract = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'Build', 'ElectionFact.json'), 'utf8'));

console.log('JSON Top-level keys:', Object.keys(contract));
if (contract.evm) {
    console.log('EVM keys:', Object.keys(contract.evm));
    if (contract.evm.bytecode) {
        console.log('Bytecode object keys:', Object.keys(contract.evm.bytecode));
        console.log('Bytecode length:', (contract.evm.bytecode.object || '').length);
    }
}
