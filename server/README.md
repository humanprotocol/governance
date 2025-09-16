# Governance Server

Governance Server is a backend service for the Human Protocol governance system. It aggregates proposals and votes from multiple Ethereum-compatible chains using a hub-and-spoke model, providing a fast and unified REST API for frontend applications.

## Features

- Queries smart contracts on the hub chain and multiple spoke chains.
- Aggregates proposal and vote data across networks.
- Caches results in Redis for fast access.
- Exposes REST API endpoints for proposals and votes.
- All configuration is managed via environment variables.

## Configuration

Create a `.env` file in the project root with the following variables:

```
PORT=5000

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0

# Governance Hub
GOVERNANCE_HUB_ADDRESS=0x...
GOVERNANCE_HUB_BLOCK_NUMBER=...
GOVERNANCE_HUB_CHAIN_ID=...

# Governance Spokes (comma-separated)
GOVERNANCE_SPOKE_ADDRESSES=0x...,0x...
GOVERNANCE_SPOKE_CHAIN_IDS=56,97

# RPC URLs
RPC_URL_SEPOLIA=https://...
RPC_URL_BSC_TESTNET=https://...
```

## API Endpoints

### Proposals

- **GET /proposals**  
  Returns a list of all proposals from the hub chain.

- **GET /proposals/:id**  
  Returns detailed information for a specific proposal.

### Votes

- **GET /votes/:proposalId/total**  
  Returns the total votes (for, against, abstain) for a proposal, aggregated from the hub and all spokes.

## Hub-and-Spoke Model

- The hub chain stores the original proposal data.
- Spoke chains synchronize voting and execution status.
- The backend aggregates votes from all configured chains.

## Setup

1. Clone the repository:  
   `git clone https://github.com/humanprotocol/governance.git`
2. Navigate to the server directory:  
   `cd server`
3. Create and configure your `.env` file as described above.
4. Install dependencies:  
   `yarn install`
5. Start the server:  
   `yarn start:dev`

## Technologies

- NestJS (backend framework)
- Redis (cache)
- ethers.js (Ethereum interaction)
- dotenv (environment variables)

## Swagger Documentation

API documentation is available at `/swagger` when the server is running.

---

**Note:**  
Restart the server after changing `.env` configuration to apply new hub or spoke settings.
