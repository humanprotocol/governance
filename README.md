# Governance UI for Human Protocol 

![Static Badge](https://img.shields.io/badge/Governance_UI-purple?style=flat)

The Governance UI serves as a central interface for interacting with the Human Protocol's governance system, incorporating elements from both our client and server components to provide a comprehensive tool for community-driven decision-making.

## About This Project

This project leverages a modified Uniswap Interface to facilitate a transparent and user-friendly governance system. It enables users to actively participate in the governance process of the Human Protocol by navigating and exploring proposals across the primary hub chain and associated spoke chains.

## Features

#### Transparent Governance Process
Transparency is achieved through features that allow users to access detailed proposals, view real-time voting results, and track the progression and outcomes of governance actions. 
#### Enhanced User Participation 
Governance UI is designed to maximize engagement across the protocol's ecosystem. The platform simplifies the voting process, making it straightforward for users to vote on proposals with tokens from the hub or any connected spoke chain.
#### User-Friendly Interface
Accessibility features are integrated to ensure that all users, regardless of their technical proficiency, can participate in the governance process. 
#### Cross-Chain Voting 
 Cross-chain voting ensures that governance is not siloed within a single blockchain but is a holistic process that leverages the strengths and community of multiple networks. 


 ## Contracts 

>[!NOTE]
>SEPOLIA is the HUB CHAIN and AVALANCHE is the SPOKE CHAIN  

#### Sepolia (Hub) 

- [HMT - Token](https://sepolia.etherscan.io/address/0xC021cFE4fDe075E8038217B1911CB0D9406B8A29#code)
- [vHMT - vote Token](https://sepolia.etherscan.io/address/0x0e73FF0E924cd51819C1ACFe160C41904DF5E70A#code)
- [TimelockController](https://sepolia.etherscan.io/address/0x2FB7aB8BcE514B8fE0c3e166A6cF0649823c4BAd#code)
- [Governor](https://sepolia.etherscan.io/address/0x3a2cc67a910F543E98Bed7F96e4CAC62651416C7#code)

#### Avalanche Fuji (Spoke)
- [HMT - Token](https://testnet.snowtrace.io/address/0xE7DBF0BA39572593769D4273f93d39BdA56df101)
- [vHMT - vote Token](https://testnet.snowtrace.io/address/0x6afbD41dC1C1cd2AF2c55eD2d98A386C18aC2dfd) 
- [Dao Spoke](https://testnet.snowtrace.io/address/0x907F05C4B0E19E316b9b28baC9DDf5E6490057c8/contract/43113/code)


### Verification process 

- ```npx hardhat verify --network polygonMumbai <HMT_ADDRESS> 1000000000 'Human Token' 18 'HMT' ```
- ```npx hardhat verify --network polygonMumbai <vHMT_ADDRESS> <HMT_ADDRESS> ```
- ```npx hardhat verify --network polygonMumbai --constructor-args arguments.js <TIMELOCK_CONTROLLER_ADDRESS> ```
- ```npx hardhat verify --network polygonMumbai --constructor-args arguments.js <GOVERNOR_ADDRESS> ```
- ```npx hardhat verify --network avalancheFujiTestnet <HMT_ADDRESS> 1000000000 'Human Token' 18 'HMT' ```
- ```npx hardhat verify --network avalancheFujiTestnet <vHMT_ADDRESS> <HMT_ADDRESS>```

>[!TIP]
>Pad the Governor address in the arguments.js to have a 32 bytes parameter. 
- ```npx hardhat verify --network avalancheFujiTestnet --constructor-args arguments.js <DAO_SPOKE>``` 


>[!TIP]
> Arguments.js file would be like this :
```
module.exports = [
  '<ADDRESS>',
  '<ADDRESS>',
  [],
  5,
  '<ADDRESS>',
  '<ADDRESS>',
  2,
  1,
  300,
  0,
  4,
];
``` 




## Key Components
### Client

> [!NOTE]
> Follow the **README** in ```/client``` directory 

- **Proposal List & Details**: View and understand proposals, their statuses, and details.
- **Voting**: Participate in governance by voting on proposals using either hub or spoke chain tokens.

### Server (Vote Aggregator)

> [!NOTE]
> Follow the **README** in ```/server``` directory 


- **Vote Collection & Aggregation**: Collects and aggregates votes across chains for accurate representation.
- **API Endpoints**: Fetch proposal details and voting results. 


## Contributing
We welcome contributions from the community. Please refer to our contribution guidelines for more information on how to participate.


## Support and Troubleshooting

Encountering issues during the setup or development process is common. Here are some steps to verify your environment and troubleshoot common problems related to Node.js version compatibility and other setup requirements.

### Verifying Node.js Version

The governance UI ```/client``` requires Node.js version 14 due to Uniswap dependencies. To ensure you have the correct version installed, follow these steps:

- Install version 14 by running ```nvm install 14```
- Switch to version 14 by running ```nvm use 14```
- Check using ```nvm --version```

### LICENSE 

Refer to the LICENSE in the project. 
