import { Inject, Injectable } from '@nestjs/common';
import { ProposalDto, ProposalDetailDto } from './proposal.dto';
import { ethers } from 'ethers';
import GOVERNOR_HUB_ABI from '@human-protocol/core/artifacts/contracts/governance/MetaHumanGovernor.sol/MetaHumanGovernor.json';
import { Web3Service } from '../web3/web3.service';
import { ChainId } from '@human-protocol/sdk';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundError, ServerError } from '../../common/errors';
import { ErrorProposal } from '../../common/constants/errors';

@Injectable()
export class ProposalsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly web3Service: Web3Service,
    private readonly serverConfigService: ServerConfigService,
  ) {}

  async getAllProposals(): Promise<ProposalDto[]> {
    const chainId = this.serverConfigService.governanceHubChainId;
    const proposalIdsKey = `proposals:ids:${chainId}`;
    let proposalIds: string[] =
      (await this.cacheManager.get(proposalIdsKey)) || [];

    const lastBlockKey = `proposals:lastBlock:${chainId}`;
    let lastBlock = await this.cacheManager.get<number>(lastBlockKey);
    if (!lastBlock)
      lastBlock = this.serverConfigService.governanceHubBlockNumber;

    const provider = this.web3Service.getProvider(chainId);
    const iface = new ethers.Interface(GOVERNOR_HUB_ABI.abi);
    const topic = iface.getEvent('ProposalCreated')?.topicHash;
    if (!topic) throw new ServerError(ErrorProposal.EventNotFound);

    const latestBlock = await provider.getBlockNumber();

    const logs = await provider.getLogs({
      topics: [topic],
      address: this.serverConfigService.governanceHubAddress!,
      fromBlock: lastBlock + 1,
      toBlock: latestBlock,
    });

    for (const log of logs) {
      const parsed = iface.parseLog(log);
      if (!parsed) continue;
      const proposalId = parsed.args.proposalId.toString();
      const proposer = parsed.args.proposer as string;
      const description = parsed.args.description as string;
      const voteStart = Number(parsed.args.voteStart);
      const voteEnd = Number(parsed.args.voteEnd);
      let title: string;
      let desc: string;
      if (description.includes('[[')) {
        title = description.replace(/\[\[(.*?)\]\]/, '').trim();
        desc = (description.match(/\[\[(.*?)\]\]/)?.[1] || '').trim();
      } else {
        title = description;
        desc = description;
      }

      const proposalDetail: ProposalDetailDto = {
        proposalId,
        title,
        description: desc,
        proposer,
        voteStart,
        voteEnd,
      };

      await this.cacheManager.set(
        `proposal:${chainId}:${proposalId}`,
        proposalDetail,
        0,
      );

      if (!proposalIds.includes(proposalId)) {
        proposalIds.push(proposalId);
      }
    }

    await this.cacheManager.set(lastBlockKey, latestBlock, 0);

    await this.cacheManager.set(proposalIdsKey, proposalIds, 0);

    const proposals: ProposalDto[] = [];
    for (const proposalId of proposalIds) {
      const proposalDetail = await this.cacheManager.get<ProposalDetailDto>(
        `proposal:${chainId}:${proposalId}`,
      );
      if (proposalDetail) {
        proposals.push({
          proposalId: proposalDetail.proposalId,
          title: proposalDetail.title,
        });
      }
    }

    return proposals;
  }

  async getProposalById(id: string): Promise<ProposalDetailDto> {
    const chainId = this.serverConfigService.governanceHubChainId;
    const cachedProposal = await this.cacheManager.get<ProposalDetailDto>(
      `proposal:${chainId}:${id}`,
    );
    if (cachedProposal) return cachedProposal;

    const provider = this.web3Service.getProvider(chainId);
    const iface = new ethers.Interface(GOVERNOR_HUB_ABI.abi);
    const topic = iface.getEvent('ProposalCreated')?.topicHash;
    if (!topic) throw new ServerError(ErrorProposal.EventNotFound);

    const logs = await provider.getLogs({
      topics: [topic],
      address: this.serverConfigService.governanceHubAddress!,
      fromBlock: this.serverConfigService.governanceHubBlockNumber,
      toBlock: 'latest',
    });

    for (const log of logs) {
      const parsed = iface.parseLog(log);
      if (!parsed) continue;

      const proposalId = parsed.args.proposalId.toString();
      if (proposalId !== id) continue;

      const description = parsed.args.description as string;
      const proposer = parsed.args.proposer as string;
      const voteStart = Number(parsed.args.voteStart);
      const voteEnd = Number(parsed.args.voteEnd);
      let title: string;
      let desc: string;
      if (description.includes('[[')) {
        title = description.replace(/\[\[(.*?)\]\]/, '').trim();
        desc = (description.match(/\[\[(.*?)\]\]/)?.[1] || '').trim();
      } else {
        title = description;
        desc = description;
      }

      const proposalDetail: ProposalDetailDto = {
        proposalId,
        title,
        description: desc,
        proposer,
        voteStart,
        voteEnd,
      };

      await this.cacheManager.set(
        `proposal:${chainId}:${proposalId}`,
        proposalDetail,
        0,
      );

      return proposalDetail;
    }

    throw new NotFoundError(ErrorProposal.NotFound);
  }
}
