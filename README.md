# Governance UI for Human Protocol 

![Static Badge](https://img.shields.io/badge/Governance_UI-purple?style=flat)

The Governance UI serves as a central interface for interacting with the Human Protocol's governance system, incorporating elements from both our client and server components to provide a comprehensive tool for community-driven decision-making.

## About This Project

This project leverages a modified Uniswap Interface to facilitate a transparent and user-friendly governance system. It enables users to actively participate in the governance process of the Human Protocol by navigating and exploring proposals across the primary hub chain and associated spoke chains.

## Features

## Key Components
### Client


> [!IMPORTANT]  
> Fill out the .env variables following .env.example 

- **Proposal List & Details**: View and understand proposals, their statuses, and details.
- **Voting**: Participate in governance by voting on proposals using either hub or spoke chain tokens.

### Server (Vote Aggregator)

> [!IMPORTANT]  
> Fill out the .env variables following .env.example 


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