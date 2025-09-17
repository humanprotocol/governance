import * as Joi from 'joi';

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string(),
  HOST: Joi.string(),
  PORT: Joi.string(),
  // Cache
  REDIS_PORT: Joi.number().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_DB: Joi.number(),
  // Governance Hub
  GOVERNANCE_HUB_ADDRESS: Joi.string().required(),
  GOVERNANCE_HUB_BLOCK_NUMBER: Joi.number().default(0),
  GOVERNANCE_HUB_CHAIN_ID: Joi.string().required(),
  GOVERNANCE_SPOKE_ADDRESSES: Joi.string().required(),
  GOVERNANCE_SPOKE_CHAIN_IDS: Joi.string().required(),
  // Web3
  RPC_URL_MAINNET: Joi.string(),
  RPC_URL_POLYGON: Joi.string(),
  RPC_URL_BSC: Joi.string(),
  RPC_URL_POLYGON_AMOY: Joi.string(),
  RPC_URL_SEPOLIA: Joi.string(),
  RPC_URL_BSC_TESTNET: Joi.string(),
  // Cache TTLs (seconds)
  CACHE_TTL_VOTES_PENDING: Joi.number().default(300),
  CACHE_TTL_VOTES_ACTIVE: Joi.number().default(180),
});
