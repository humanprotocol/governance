import GOVERNOR_SPOKE_ABI from '@human-protocol/core/artifacts/contracts/governance/DAOSpokeContract.sol/DAOSpokeContract.json';
import GOVERNOR_HUB_ABI from '@human-protocol/core/artifacts/contracts/governance/MetaHumanGovernor.sol/MetaHumanGovernor.json';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { ServerConfigService } from '../../common/config/server-config.service';
import { ProposalStatus } from '../../common/enums/proposals';
import { Web3Service } from '../web3/web3.service';
import { VoteTotalDto } from './vote.dto';
import { NotFoundError, ServerError } from '../../common/errors';
import { ErrorVote } from '../../common/constants/errors';

@Injectable()
export class VoteService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly web3Service: Web3Service,
    private readonly serverConfigService: ServerConfigService,
  ) {}

  async getTotalVotes(proposalId: string): Promise<VoteTotalDto> {
    const cacheKey = `votes:${proposalId}`;
    let cached = await this.cacheManager.get<VoteTotalDto>(cacheKey);
    if (cached) return cached;

    let hubProvider, hubContract;
    try {
      hubProvider = this.web3Service.getProvider(
        this.serverConfigService.governanceHubChainId,
      );
      hubContract = new ethers.Contract(
        this.serverConfigService.governanceHubAddress,
        GOVERNOR_HUB_ABI.abi,
        hubProvider,
      );
    } catch (err: any) {
      throw new ServerError(ErrorVote.HubContractError, err.stack);
    }

    let status: number;
    try {
      status = Number(await hubContract.state(proposalId));
    } catch (err: any) {
      throw new NotFoundError(ErrorVote.NotFound, err.stack);
    }

    if (status === ProposalStatus.Pending) {
      const result: VoteTotalDto = {
        proposalId,
        forVotes: 0,
        againstVotes: 0,
        abstainVotes: 0,
      };
      await this.cacheManager.set(
        cacheKey,
        result,
        this.serverConfigService.cacheTtlVotesPending,
      );
      return result;
    }

    let totalFor = 0;
    let totalAgainst = 0;
    let totalAbstain = 0;

    let hubVotes;
    try {
      hubVotes = await hubContract.proposalVotes(proposalId);
    } catch (err: any) {
      throw new ServerError(ErrorVote.HubContractError, err.stack);
    }
    totalFor += Number(hubVotes.forVotes);
    totalAbstain += Number(hubVotes.abstainVotes);
    totalAgainst += Number(hubVotes.againstVotes);

    let collectionFinished = false;
    try {
      collectionFinished = await hubContract.collectionFinished(proposalId);
    } catch {}

    const shouldQuerySpokes =
      status === ProposalStatus.Active ||
      ((status === ProposalStatus.Succeeded ||
        status === ProposalStatus.Defeated) &&
        !collectionFinished);

    if (shouldQuerySpokes) {
      for (
        let i = 0;
        i < this.serverConfigService.governanceSpokeChainIds.length;
        i++
      ) {
        const chainId = this.serverConfigService.governanceSpokeChainIds[i];
        const address = this.serverConfigService.governanceSpokeAddresses[i];
        let contract;
        try {
          const provider = this.web3Service.getProvider(chainId);
          contract = new ethers.Contract(
            address,
            GOVERNOR_SPOKE_ABI.abi,
            provider,
          );
        } catch (err: any) {
          throw new ServerError(ErrorVote.SpokeContractError, err.stack);
        }
        let spokeVotes;
        try {
          spokeVotes = await contract.proposalVotes(proposalId);
        } catch (err: any) {
          throw new ServerError(ErrorVote.SpokeContractError, err.stack);
        }
        totalFor += Number(spokeVotes.forVotes);
        totalAgainst += Number(spokeVotes.againstVotes);
        totalAbstain += Number(spokeVotes.abstainVotes);
      }

      await this.cacheManager.set(
        cacheKey,
        {
          proposalId,
          forVotes: totalFor,
          againstVotes: totalAgainst,
          abstainVotes: totalAbstain,
        },
        this.serverConfigService.cacheTtlVotesActive,
      );
    } else {
      await this.cacheManager.set(
        cacheKey,
        {
          proposalId,
          forVotes: totalFor,
          againstVotes: totalAgainst,
          abstainVotes: totalAbstain,
        },
        0,
      );
    }

    return {
      proposalId,
      forVotes: totalFor,
      againstVotes: totalAgainst,
      abstainVotes: totalAbstain,
    };
  }
}
