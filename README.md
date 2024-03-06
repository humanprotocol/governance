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