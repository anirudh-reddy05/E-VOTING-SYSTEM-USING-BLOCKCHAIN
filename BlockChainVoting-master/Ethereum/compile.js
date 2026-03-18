const path = require("path");
const fs = require("fs-extra");
const solc = require("solc");

const buildPath = path.resolve(__dirname, 'Build');
fs.removeSync(buildPath); //deletes the build folder

const contractPath = path.resolve(__dirname, 'Contract', 'Election.sol');
const source = fs.readFileSync(contractPath, 'utf-8');

const input = {
  language: 'Solidity',
  sources: {
    'Election.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*'],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

fs.ensureDirSync(buildPath); //checks if exists; if doesn't, create one

for (let contractFile in output.contracts) {
  for (let contractName in output.contracts[contractFile]) {
    fs.outputJsonSync(
      path.resolve(buildPath, contractName + '.json'),
      output.contracts[contractFile][contractName]
    );
  }
}