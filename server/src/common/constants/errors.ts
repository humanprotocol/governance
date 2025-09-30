export enum ErrorProposal {
  NotFound = 'Proposal not found',
  EventNotFound = 'ProposalCreated event not found in contract ABI',
}

export enum ErrorVote {
  NotFound = 'Votes not found',
  HubContractError = 'Error accessing hub contract',
  SpokeContractError = 'Error accessing spoke contract',
}
