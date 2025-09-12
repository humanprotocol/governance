import { isAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { formatEther, parseEther } from '@ethersproject/units'
import GOVERNOR_SPOKE_ABI from '@human-protocol/core/artifacts/contracts/governance/DAOSpokeContract.sol/DAOSpokeContract.json'
import GOVERNOR_HUB_ABI from '@human-protocol/core/artifacts/contracts/governance/MetaHumanGovernor.sol/MetaHumanGovernor.json'
import { t } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import HmtUniJSON from 'abis/HMToken.json'
import UniJSON from 'abis/VHMToken.json'
import { fetchProposalDetails, fetchProposals, Proposal, ProposalDetails } from 'api/proposals'
import { fetchVotes } from 'api/votes'
import { GOVERNANCE_HUB_ADDRESS, GOVERNANCE_SPOKE_ADRESSES } from 'constants/addresses'
import { HUB_CHAIN_ID } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { useContract, useContractWithCustomProvider } from 'hooks/useContract'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppSelector } from 'state/hooks'
import { calculateGasMargin } from 'utils/calculateGasMargin'

import { UNI } from '../../constants/tokens'
import { useTransactionAdder } from '../transactions/hooks'
import { TransactionType } from '../transactions/types'
import { VoteOption } from './types'

export function useGovernanceHubContract(): Contract | null {
  const { abi } = GOVERNOR_HUB_ABI

  return useContractWithCustomProvider(GOVERNANCE_HUB_ADDRESS, abi, RPC_PROVIDERS[HUB_CHAIN_ID as SupportedChainId])
}

function useGovernanceSpokeContract(): Contract | null {
  return useContract(GOVERNANCE_SPOKE_ADRESSES, GOVERNOR_SPOKE_ABI.abi)
}

export function useUniContract() {
  const { chainId } = useWeb3React()
  const uniAddress = useMemo(() => (chainId ? UNI[chainId]?.address : undefined), [chainId])
  return useContract(uniAddress, UniJSON.abi, true)
}

export function useHMTUniContract() {
  const { chainId } = useWeb3React()

  const uniContract = useUniContract()

  const [underlyingAddress, setUnderlyingAddress] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleSetHMTLoading = (bool: boolean) => {
    setLoading(bool)
  }

  useEffect(() => {
    handleSetHMTLoading(false)
  }, [chainId])

  useEffect(() => {
    const fetchUnderlyingAddress = async () => {
      setLoading(true)
      if (uniContract && uniContract.signer) {
        try {
          const address = await uniContract.functions.underlying()
          setUnderlyingAddress(address[0])
        } catch (error) {
          console.log(error)
          setLoading(false)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchUnderlyingAddress()
  }, [uniContract, chainId])

  const hmtUniContract = useContract(underlyingAddress, HmtUniJSON.abi, true)

  return { hmtUniContract, loading, handleSetHMTLoading }
}

export interface ProposalExecutionData {
  targets: string[]
  values: string[]
  calldatas: string[]
  descriptionHash: string
}

export interface ProposalData {
  id: string
  title: string
  status: ProposalState
}

export enum ProposalState {
  UNDETERMINED = -1,
  PENDING,
  ACTIVE,
  CANCELED,
  DEFEATED,
  SUCCEEDED,
  QUEUED,
  EXPIRED,
  EXECUTED,
  COLLECTION_PHASE,
}

// get data for all past and active proposals
export function useAllProposalData(): { data: ProposalData[]; loading: boolean } {
  const [proposalStatuses, setProposalStatuses] = useState<number[]>([])

  const { chainId } = useWeb3React()
  const govHubContract = useGovernanceHubContract()
  const transactions = useAppSelector((state) => state.transactions)

  const { proposals } = useGetAllProposals()
  const proposalIndexes = proposals.map((proposal) => proposal.proposalId)

  const uniToken = useMemo(() => (chainId ? UNI[chainId] : undefined), [chainId])

  // get all proposal statuses
  useEffect(() => {
    async function getProposalStatuses() {
      const proposalStatesV2Promises = proposalIndexes.map(async (id) => {
        const [status] = await govHubContract?.functions.state(id.toString(), {})
        return status
      })

      const proposalStatesV2 = await Promise.all(proposalStatesV2Promises)
      setProposalStatuses(proposalStatesV2)
    }

    if (proposalIndexes.length > proposalStatuses.length) getProposalStatuses()
  }, [govHubContract, proposalStatuses, transactions, proposalIndexes])

  // early return until events are fetched
  return useMemo(() => {
    if (!uniToken || (govHubContract && !proposals)) {
      return { data: [], loading: true }
    }

    return {
      data: proposals.map((proposal, i) => {
        return {
          id: proposal.proposalId,
          title: proposal.title ?? t`Untitled`,
          status: proposalStatuses[i] ?? ProposalState.UNDETERMINED,
        }
      }),
      loading: false,
    }
  }, [proposals, govHubContract, uniToken, proposalStatuses])
}

// get the users delegatee if it exists
export function useUserDelegatee(): { userDelegatee: string; isLoading: boolean } {
  const [userDelegatee, setUserDelegatee] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const { account } = useWeb3React()
  const uniContract = useUniContract()
  const transactions = useAppSelector((state) => state.transactions)

  useEffect(() => {
    setIsLoading(true)
    async function getDelegatee() {
      if (uniContract) {
        try {
          const getDelegateeResponse = account && (await uniContract?.functions.delegates(account.toString()))
          setUserDelegatee(getDelegateeResponse)
        } catch (error) {
          console.log(error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    getDelegatee()
  }, [account, uniContract, transactions])

  return { userDelegatee, isLoading }
}

// gets the users current votes
export function useUserVotes(): { availableVotes: CurrencyAmount<Token> | undefined; isLoading: boolean } {
  const [availableVotes, setAvailableVotes] = useState<CurrencyAmount<Token> | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const { account, chainId } = useWeb3React()

  const uniContract = useUniContract()
  const transactions = useAppSelector((state) => state.transactions)

  const uni = useMemo(() => (chainId ? UNI[chainId] : undefined), [chainId])

  useEffect(() => {
    setIsLoading(true)
    async function getUserVotesFromUni() {
      if (uniContract) {
        try {
          const getVotesResponse = account && (await uniContract?.functions.getVotes(account.toString()))
          const getVotesParsed =
            uni && getVotesResponse ? CurrencyAmount.fromRawAmount(uni, getVotesResponse) : undefined
          setAvailableVotes(getVotesParsed)
        } catch (error) {
          console.log(error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    getUserVotesFromUni()
  }, [account, uniContract, uni, transactions])

  return { isLoading, availableVotes }
}

// fetch available votes as of block (usually proposal start block)
export function useUserVotesAsOfBlock(block: number | undefined, id: string): CurrencyAmount<Token> | undefined {
  const [userVotesAsOfBlockAmount, setUserVotesAsOfBlockAmount] = useState()

  const { account, chainId } = useWeb3React()
  const isHubChainActive = useAppSelector((state) => state.application.isHubChainActive)

  const governanceHubContract = useGovernanceHubContract()
  const governanceSpokeContract = useGovernanceSpokeContract()
  const spokeVoteTokenContract = useUniContract()

  const uni = useMemo(() => (chainId ? UNI[chainId] : undefined), [chainId])

  useEffect(() => {
    async function getUserVotesAsOfBlock() {
      if (isHubChainActive && block) {
        const getVotesAsOfBlockResponse =
          account && (await governanceHubContract?.functions.getVotes(account.toString(), block.toString()))
        setUserVotesAsOfBlockAmount(getVotesAsOfBlockResponse)
      } else if (!isHubChainActive && governanceSpokeContract) {
        const { localVoteStart } = await governanceSpokeContract.functions.proposals(id)

        const getVotesAsOfBlockResponse =
          account &&
          (await spokeVoteTokenContract?.functions.getPastVotes(account.toString(), localVoteStart.toString()))
        setUserVotesAsOfBlockAmount(getVotesAsOfBlockResponse)
      }
    }

    getUserVotesAsOfBlock()
  }, [block, isHubChainActive, account, governanceSpokeContract, spokeVoteTokenContract, governanceHubContract, id])

  return userVotesAsOfBlockAmount && uni ? CurrencyAmount.fromRawAmount(uni, userVotesAsOfBlockAmount) : undefined
}

export function useDelegateCallback(): (delegatee: string | undefined) => undefined | Promise<string> {
  const { account, chainId, provider } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const uniContract = useUniContract()

  return useCallback(
    (delegatee: string | undefined) => {
      if (!provider || !chainId || !account || !delegatee || !isAddress(delegatee ?? '')) return undefined
      const args = [delegatee]
      if (!uniContract) throw new Error('No UNI Contract!')
      return uniContract.estimateGas.delegate(...args, {}).then((estimatedGasLimit) => {
        return uniContract
          .delegate(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              type: TransactionType.DELEGATE,
              delegatee,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, chainId, provider, uniContract]
  )
}

export function useVoteCallback(): (
  proposalId: string | undefined,
  voteOption: VoteOption
) => undefined | Promise<string> {
  const { account, chainId } = useWeb3React()
  const isHubChainActive = useAppSelector((state) => state.application.isHubChainActive)

  const contract = useContract(
    isHubChainActive ? GOVERNANCE_HUB_ADDRESS : GOVERNANCE_SPOKE_ADRESSES,
    isHubChainActive ? GOVERNOR_HUB_ABI.abi : GOVERNOR_SPOKE_ABI.abi
  )

  const addTransaction = useTransactionAdder()

  return useCallback(
    (proposalId: string | undefined, voteOption: VoteOption) => {
      if (!account || !contract || !proposalId || !chainId) return
      const args = [proposalId, voteOption === VoteOption.Against ? 0 : voteOption === VoteOption.For ? 1 : 2]
      return contract.castVote(...args, { value: null }).then((response: TransactionResponse) => {
        addTransaction(response, {
          type: TransactionType.VOTE,
          decision: voteOption,
          governorAddress: contract.address,
          proposalId: parseInt(proposalId),
          reason: '',
        })
        return response.hash
      })
    },
    [account, addTransaction, contract, chainId]
  )
}

export function useRequestCollections(): (
  proposalId: string | undefined,
  value?: number
) => undefined | Promise<string> {
  const { account, chainId } = useWeb3React()
  const contract = useContract(GOVERNANCE_HUB_ADDRESS, GOVERNOR_HUB_ABI.abi)
  const addTransaction = useTransactionAdder()

  return useCallback(
    (proposalId: string | undefined, value?: number) => {
      const amount = value ?? 0.05
      if (!account || !contract || !proposalId || !chainId) return
      return contract
        .requestCollections(proposalId, { value: parseEther(amount.toString()) })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            type: TransactionType.REQUEST_COLLECTIONS,
            governorAddress: contract.address,
            proposalId: parseInt(proposalId),
          })
          return response.hash
        })
    },
    [account, addTransaction, contract, chainId]
  )
}

export function useCollectionStatus(proposalId: string): {
  collectionStartedResponse: boolean
  collectionFinishedResponse: boolean
  loading: boolean
} {
  const [collectionStartedResponse, setCollectionStartedResponse] = useState<boolean>(false)
  const [collectionFinishedResponse, setCollectionFinishedResponse] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  const transactions = useAppSelector((state) => state.transactions)
  const contract = useContract(GOVERNANCE_HUB_ADDRESS, GOVERNOR_HUB_ABI.abi)

  useEffect(() => {
    if (contract && proposalId) {
      setLoading(true)
      contract.collectionStarted(proposalId).then((response: boolean) => {
        setCollectionStartedResponse(response)
        setLoading(false)
      })
    }
  }, [contract, proposalId, transactions])

  useEffect(() => {
    if (!!collectionStartedResponse && contract && proposalId) {
      setLoading(true)
      contract.collectionFinished(proposalId).then((response: boolean) => {
        setCollectionFinishedResponse(response)
        setLoading(false)
      })
    }
  }, [contract, proposalId, transactions, collectionStartedResponse])

  return { collectionStartedResponse, collectionFinishedResponse, loading }
}

export function useCancelCallback(): (
  proposalId: string | undefined,
  proposalExecutionData: ProposalExecutionData | undefined,
  value?: number
) => undefined | Promise<string> {
  const { account, chainId } = useWeb3React()

  const contract = useContract(GOVERNANCE_HUB_ADDRESS, GOVERNOR_HUB_ABI.abi)
  const addTransaction = useTransactionAdder()

  return useCallback(
    (proposalId: string | undefined, proposalExecutionData: ProposalExecutionData | undefined, value?: number) => {
      const amount = value ?? 0.025
      if (!contract || !proposalId) return
      const { targets, values, calldatas, descriptionHash } = proposalExecutionData || {}
      return contract
        .crossChainCancel(targets, values, calldatas, descriptionHash, { value: parseEther(amount.toString()) })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            type: TransactionType.CANCEL,
            governorAddress: contract.address,
            proposalId: parseInt(proposalId),
          })
          return response.hash
        })
    },
    [addTransaction, contract, account, chainId]
  )
}

export function useQueueCallback(): (
  proposalId: string | undefined,
  proposalExecutionData: ProposalExecutionData | undefined
) => undefined | Promise<string> {
  const contract = useContract(GOVERNANCE_HUB_ADDRESS, GOVERNOR_HUB_ABI.abi)
  const addTransaction = useTransactionAdder()

  return useCallback(
    (proposalId: string | undefined, proposalExecutionData: ProposalExecutionData | undefined) => {
      const { targets, values, calldatas, descriptionHash } = proposalExecutionData || {}

      if (!contract || !proposalId) return
      return contract.queue(targets, values, calldatas, descriptionHash).then((response: TransactionResponse) => {
        addTransaction(response, {
          type: TransactionType.QUEUE,
          governorAddress: contract.address,
          proposalId: parseInt(proposalId),
        })
        return response.hash
      })
    },
    [addTransaction, contract]
  )
}

export function useExecuteCallback(): (
  proposalId: string | undefined,
  proposalExecutionData: ProposalExecutionData | undefined
) => undefined | Promise<string> {
  const contract = useContract(GOVERNANCE_HUB_ADDRESS, GOVERNOR_HUB_ABI.abi)
  const addTransaction = useTransactionAdder()

  return useCallback(
    (proposalId: string | undefined, proposalExecutionData: ProposalExecutionData | undefined) => {
      const { targets, values, calldatas, descriptionHash } = proposalExecutionData || {}

      if (!contract || !proposalId) return
      return contract.execute(targets, values, calldatas, descriptionHash).then((response: TransactionResponse) => {
        addTransaction(response, {
          type: TransactionType.EXECUTE,
          governorAddress: contract.address,
          proposalId: parseInt(proposalId),
        })
        return response.hash
      })
    },
    [addTransaction, contract]
  )
}

export function useHasVoted(proposalId: string | undefined): boolean {
  const { account, chainId } = useWeb3React()
  const addTransaction = useTransactionAdder()

  const isHubChainActive = useAppSelector((state) => state.application.isHubChainActive)
  const transactions = useAppSelector((state) => state.transactions)

  const contract = useContract(
    isHubChainActive ? GOVERNANCE_HUB_ADDRESS : GOVERNANCE_SPOKE_ADRESSES,
    isHubChainActive ? GOVERNOR_HUB_ABI.abi : GOVERNOR_SPOKE_ABI.abi
  )

  const [hasVoted, setHasVoted] = useState<boolean>(false)

  useEffect(() => {
    if (!account || !contract || !proposalId || !chainId) return

    contract.hasVoted(proposalId, account).then((response: boolean) => {
      setHasVoted(response)
    })
  }, [account, contract, proposalId, chainId, transactions, addTransaction])

  return hasVoted
}

const toBigNumber = (value: number | string): BigNumber => {
  return BigNumber.from(value.toString())
}

export function useGetAllVotes(proposalId: string | undefined) {
  const [votes, setVotes] = useState<{ for: number; against: number; abstain: number }>({
    for: 0,
    against: 0,
    abstain: 0,
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!proposalId) return

    setLoading(true)
    setError(null)

    fetchVotes(proposalId)
      .then((data) => {
        const formattedData = {
          for: +formatEther(toBigNumber(data.forVotes)),
          against: +formatEther(toBigNumber(data.againstVotes)),
          abstain: +formatEther(toBigNumber(data.abstainVotes)),
        }
        setVotes(formattedData)
      })
      .catch((err) => {
        setError(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [proposalId])

  return { votes, loading, error }
}

export function useGetAllProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetchProposals()
      .then((data) => {
        setProposals(data)
      })
      .catch((err) => {
        setError(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return { proposals, loading, error }
}

export function useGetProposalDetails(proposalId: string) {
  const [proposalDetails, setProposalDetails] = useState<ProposalDetails | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetchProposalDetails(proposalId)
      .then((data) => {
        setProposalDetails(data)
      })
      .catch((err) => {
        setError(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [proposalId])

  return { proposalDetails, loading, error }
}
