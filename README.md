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
>MUMBAI is the HUB CHAIN and AVALANCHE is the SPOKE CHAIN  

#### Mumbai (Hub) 

- [HMT - Token](https://mumbai.polygonscan.com/address/0x076CCe4311997Dd6B370ff9b6407786eB0e33d60#code)
- [vHMT - vote Token](https://mumbai.polygonscan.com/address/0x700cfdf6703BC6B079f0dEB2D979917C63046024#code)
- [TimelockController](https://mumbai.polygonscan.com/address/0xC63E411196fDdaBB5D8e155659876b053050Fd5d#code)
- [Governor](https://mumbai.polygonscan.com/address/0xb933ceFcfceB73F6396aEd10793486a0212Ec7D2#code)

#### Avalanche (Spoke)
- [HMT - Token](https://testnet.snowtrace.io/address/0xB58f8eA7916501E80CfC848165c92E4Cc34511fF/contract/43113/code)
- [vHMT - vote Token](https://testnet.snowtrace.io/address/0xD804Fe2e52180C6A38d7BdFeB5163b2D40BE958E/contract/43113/code) 
- [Dao Spoke](https://testnet.snowtrace.io/address/0xcAd4C61fC7F600D2786bf9CE0c21C9a502ba9814/contract/43113/code)


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
