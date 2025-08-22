import { Inject, Injectable } from '@nestjs/common';
import { ProposalDto, ProposalDetailDto } from './proposal.dto';
import { ethers } from 'ethers';
import GOVERNOR_HUB_ABI from '@human-protocol/core/artifacts/contracts/governance/MetaHumanGovernor.sol/MetaHumanGovernor.json';
import { Web3Service } from '../web3/web3.service';
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

  private async getQuorumValue(
    provider: ethers.Provider,
    snapshotBlock: number,
  ): Promise<string> {
    try {
      const governor = new ethers.Contract(
        this.serverConfigService.governanceHubAddress,
        GOVERNOR_HUB_ABI.abi,
        provider,
      );
      return (await governor.quorum(snapshotBlock)).toString();
    } catch {
      return '0';
    }
  }

  private async fetchProposalLogs(
    provider: ethers.Provider,
    fromBlock: number,
    toBlock: number | 'latest',
  ): Promise<{
    proposals: ProposalDetailDto[];
    latestBlock: number;
  }> {
    const iface = new ethers.Interface(GOVERNOR_HUB_ABI.abi);
    const topic = iface.getEvent('ProposalCreated')?.topicHash;
    if (!topic) throw new ServerError(ErrorProposal.EventNotFound);

    const latestBlock =
      toBlock === 'latest' ? await provider.getBlockNumber() : toBlock;

    const logs = await provider.getLogs({
      topics: [topic],
      address: this.serverConfigService.governanceHubAddress!,
      fromBlock,
      toBlock: latestBlock,
    });

    const proposals: ProposalDetailDto[] = [];
    for (const log of logs) {
      const parsed = iface.parseLog(log);
      if (!parsed) continue;

      const proposalId = parsed.args.proposalId.toString();
      const proposer = parsed.args.proposer as string;
      const description = parsed.args.description as string;
      const voteStart = Number(parsed.args.voteStart) * 1000;
      const voteEnd = Number(parsed.args.voteEnd) * 1000;

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
        quorum: '0',
      };
      proposals.push(proposalDetail);
    }
    return { proposals, latestBlock };
  }

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

    const { proposals: proposalsDetails, latestBlock } =
      await this.fetchProposalLogs(provider, lastBlock + 1, 'latest');

    for (const proposal of proposalsDetails) {
      await this.cacheManager.set(
        `proposal:${chainId}:${proposal.proposalId}`,
        proposal,
        0,
      );

      if (!proposalIds.includes(proposal.proposalId)) {
        proposalIds.push(proposal.proposalId);
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
    const cacheKey = `proposal:${chainId}:${id}`;
    const cachedProposal =
      await this.cacheManager.get<ProposalDetailDto>(cacheKey);
    const provider = this.web3Service.getProvider(chainId);

    if (cachedProposal) {
      if (
        cachedProposal.quorum === '0' &&
        Date.now() > cachedProposal.voteStart
      ) {
        const newQuorum = await this.getQuorumValue(
          provider,
          cachedProposal.voteStart / 1000,
        );
        const proposal: ProposalDetailDto = {
          ...cachedProposal,
          quorum: newQuorum,
        };
        await this.cacheManager.set(cacheKey, proposal, 0);

        return proposal;
      }
      return cachedProposal;
    }

    throw new NotFoundError(ErrorProposal.NotFound);
  }
}
