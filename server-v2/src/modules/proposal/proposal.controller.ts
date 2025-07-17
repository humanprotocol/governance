import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ProposalsService } from './proposal.service';
import { ProposalDto, ProposalDetailDto } from './proposal.dto';

@ApiTags('Proposals')
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all proposals' })
  async getAll(): Promise<ProposalDto[]> {
    return this.proposalsService.getAllProposals();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get proposal by id' })
  @ApiParam({ name: 'id', type: String })
  async getById(@Param('id') id: string): Promise<ProposalDetailDto> {
    const proposal = await this.proposalsService.getProposalById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }
}
