import { API_URL } from 'api'

export interface ChainVoteData {
  proposalId: string
  forVotes: number
  againstVotes: number
  abstainVotes: number
}

export async function fetchVotes(proposalId: string): Promise<ChainVoteData> {
  const response = await fetch(API_URL + '/votes/' + proposalId)

  if (!response.ok) {
    throw new Error(`Failed to fetch votes for proposal: ${proposalId}`)
  }

  const data = await response.json()
  return data
}
