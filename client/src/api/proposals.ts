import { API_URL } from 'api'

export interface Proposal {
  proposalId: string
  title: string
}

export interface ProposalDetails {
  proposalId: string
  title: string
  description: string
  proposer: string
  voteStart: number
  voteEnd: number
  quorum: string
}

export async function fetchProposals(): Promise<Proposal[]> {
  const response = await fetch(API_URL + '/proposals')

  if (!response.ok) {
    throw new Error('Failed to fetch proposals')
  }

  const data = await response.json()
  return data
}

export async function fetchProposalDetails(proposalId: string): Promise<ProposalDetails> {
  const response = await fetch(API_URL + '/proposals/' + proposalId)

  if (!response.ok) {
    throw new Error('Failed to fetch proposal data')
  }

  const data = await response.json()
  return data
}
