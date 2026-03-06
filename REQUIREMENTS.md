# Requirements and Setup Guide for BlockChainVoting Project

## Prerequisites

Before running this project, ensure you have the following installed on your system:

### 1. Node.js
- **Required Version**: 11.14.0 (as specified in the original README)
- **Download**: https://nodejs.org/dist/v11.14.0/
- **Note**: The project was built with this version. Newer versions may cause compatibility issues with native modules.

### 2. Git
- **Download**: https://git-scm.com/downloads
- **Purpose**: Required for installing some npm dependencies.

### 3. Visual Studio Build Tools (for Windows)
- **Download**: Visual Studio Installer
- **Workload**: "Desktop development with C++"
- **Purpose**: Required for compiling native Node.js modules (e.g., bcrypt, sha3).

### 4. MongoDB
- **Download**: https://www.mongodb.com/try/download/community
- **Installation**: Install MongoDB Community Server
- **Configuration**: Ensure MongoDB is running on localhost:27017
- **Start Service**: Run `mongod` or start the MongoDB service.

### 5. Ganache (for local Ethereum blockchain)
- **Download**: https://trufflesuite.com/ganache/
- **Purpose**: Local blockchain for testing smart contracts.

### 6. MetaMask Browser Extension
- **Download**: https://metamask.io/download.html
- **Purpose**: Ethereum wallet for interacting with the application.

## Environment Setup

### 1. Clone or Download the Project
- Ensure the project is in a directory without spaces in the path if possible (to avoid issues).

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create a `.env` file in the root directory with:
```
EMAIL=YOUR_EMAIL_ID
PASSWORD=YOUR_PASSWORD_FOR_EMAIL_ID
```
Replace with your actual email credentials for sending notifications.

### 4. Start MongoDB
Ensure MongoDB is running:
```bash
mongod
```

### 5. Start Ganache
- Open Ganache and create a new workspace.
- Note the RPC server URL (usually http://127.0.0.1:7545) and a private key from one of the accounts.

### 6. Deploy Smart Contracts (Optional for local testing)
- Update `Ethereum/deploy.js` to use local Ganache instead of Rinkeby.
- Run the deployment script.

### 7. Run the Application
```bash
npm start
```
- The application will be available at http://localhost:3000

## Additional Notes

- If you encounter issues with Node.js version, consider using Node Version Manager (nvm) for Windows: https://github.com/coreybutler/nvm-windows
- For production deployment, update the smart contract deployment to use a testnet or mainnet instead of local Ganache.
- Ensure your firewall allows connections on port 3000 and MongoDB port 27017.

## Troubleshooting

- If npm install fails, try clearing npm cache: `npm cache clean --force`
- For compilation errors, ensure Visual Studio Build Tools are properly installed.
- Check Node.js and npm versions: `node --version` and `npm --version`