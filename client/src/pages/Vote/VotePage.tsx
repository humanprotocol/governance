import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import CancelModal from 'components/vote/CancelModal'
import ExecuteModal from 'components/vote/ExecuteModal'
import QueueModal from 'components/vote/QueueModal'
import RequestCollectionsModal from 'components/vote/RequestCollectionsModal'
import { useActiveLocale } from 'hooks/useActiveLocale'
import JSBI from 'jsbi'
import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import { Box } from 'nft/components/Box'
import { WarningCircleIcon } from 'nft/components/icons'
import VotingButtons from 'pages/Vote/VotingButtons'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import ReactMarkdown from 'react-markdown'
import { useParams } from 'react-router-dom'
import { useAppSelector } from 'state/hooks'
import styled from 'styled-components/macro'

import { ButtonPrimary } from '../../components/Button'
import { GrayCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import { CardSection, DataCard } from '../../components/earn/styled'
import { RowBetween, RowFixed } from '../../components/Row'
import DelegateModal from '../../components/vote/DelegateModal'
import VoteModal from '../../components/vote/VoteModal'
import { ZERO_ADDRESS } from '../../constants/misc'
import { UNI } from '../../constants/tokens'
import {
  useModalIsOpen,
  useToggleCancelModal,
  useToggleDelegateModal,
  useToggleExecuteModal,
  useToggleQueueModal,
  useToggleRequestCollectionsModal,
  useToggleVoteModal,
} from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import {
  ProposalState,
  useCancelCallback,
  useCollectionStatus,
  useGetAllVotes,
  useGetProposalDetails,
  useGovernanceHubContract,
  useHasVoted,
  useUserDelegatee,
  useUserVotesAsOfBlock,
} from '../../state/governance/hooks'
import { VoteOption } from '../../state/governance/types'
import { ExternalLink, StyledInternalLink, ThemedText } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ProposalStatus } from './styled'

const PageWrapper = styled(AutoColumn)`
  display: flex;
  padding-top: 68px;
  width: 820px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    width: unset;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 48px 8px 0px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding: 20px 0 0;
  }
`

const ProposalInfo = styled(AutoColumn)`
  position: relative;
  justify-content: center;
  max-width: 820px;
  width: 100%;
  padding: 1.5rem;
  border-radius: 12px;
  background: ${({ theme }) => theme.backgroundSurface};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 16px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding: 12px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.xs}px`}) {
    padding: 12px;
  }
`

const ArrowWrapper = styled(StyledInternalLink)`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 24px;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 15px;
  font-weight: 600;

  a {
    color: ${({ theme }) => theme.textPrimary};
    text-decoration: none;
  }
  :hover {
    text-decoration: none;
  }
`

const StyledTitleAutoColumn = styled(AutoColumn)`
  width: 100%;
  margin-top: 24px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    margin-top: 24px;
  }
`

const CardWrapper = styled.div<{ display: string }>`
  gap: 12px;
  width: 100%;
  display: ${({ display }) => display};
`

const StyledDataCard = styled(DataCard)`
  width: 100%;
  background: none;
  background-color: ${({ theme }) => theme.deprecated_bg1};
  height: fit-content;
  z-index: 2;
  border-radius: 7px;
`

const ProgressWrapper = styled.div`
  width: 100%;
  margin-top: 1rem;
  height: 4px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.deprecated_bg3};
  position: relative;
`

export const Progress = styled.div<{ percentageString?: string }>`
  height: 100%;
  width: ${({ percentageString }) => percentageString ?? '0%'};
  max-width: 100%;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.textPrimary};
`

const MarkDownWrapper = styled.div`
  max-width: 640px;
  overflow: hidden;
`

const WrapSmall = styled(RowBetween)`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    align-items: flex-start;
  `};
`

const ProposerAddressLink = styled(ExternalLink)`
  word-break: break-all;
  color: ${({ theme }) => theme.textVioletSecondary};
`

function MarkdownImage({ ...rest }) {
  return <img {...rest} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
}

export default function VotePage() {
  const { id } = useParams() as { id: string }

  const { votes, loading } = useGetAllVotes(id)
  const { proposalDetails } = useGetProposalDetails(id)

  const forVotes = votes['for']
  const againstVotes = votes['against']
  const abstainVotes = votes['abstain']

  const { chainId, account } = useWeb3React()
  const govHubContract = useGovernanceHubContract()
  const isHubChainActive = useAppSelector((state) => state.application.isHubChainActive)
  const hasVoted = useHasVoted(id)
  const cancelCallback = useCancelCallback()

  // update vote option based on button interactions
  const [voteOption, setVoteOption] = useState<VoteOption | undefined>(undefined)
  const [status, setStatus] = useState<ProposalState>(ProposalState.UNDETERMINED)
  const [markdownContent, setMarkdownContent] = useState('')

  // modal for casting votes
  const showVoteModal = useModalIsOpen(ApplicationModal.VOTE)
  const toggleVoteModal = useToggleVoteModal()

  const showCancelModal = useModalIsOpen(ApplicationModal.CANCEL)
  const toggleCancelModal = useToggleCancelModal()

  // toggle for showing delegation modal
  const showDelegateModal = useModalIsOpen(ApplicationModal.DELEGATE)
  const toggleDelegateModal = useToggleDelegateModal()

  // Request collections modal
  const showRequestCollectionsModal = useModalIsOpen(ApplicationModal.REQUEST_COLLECTIONS)
  const toggleRequestCollectionsModal = useToggleRequestCollectionsModal()

  // toggle for showing queue modal
  const showQueueModal = useModalIsOpen(ApplicationModal.QUEUE)
  const toggleQueueModal = useToggleQueueModal()

  // toggle for showing execute modal
  const showExecuteModal = useModalIsOpen(ApplicationModal.EXECUTE)
  const toggleExecuteModal = useToggleExecuteModal()

  // get and format date from data
  const now = new Date().getTime()
  const locale = useActiveLocale()
  const dateFormat: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
  }
  const startDate = new Date(proposalDetails?.voteStart || 0).toLocaleString(locale, dateFormat)
  const endDate = new Date(proposalDetails?.voteEnd || 0).toLocaleString(locale, dateFormat)

  const totalVotes = forVotes + abstainVotes

  const quorumNumber = +formatEther(BigNumber.from(proposalDetails?.quorum || '0'))
  const quorumPercentage =
    totalVotes > 0 && quorumNumber > 0 ? (((forVotes + againstVotes + abstainVotes) / quorumNumber) * 100).toFixed() : 0

  // only count available votes as of the proposal start block
  const availableVotes: CurrencyAmount<Token> | undefined = useUserVotesAsOfBlock(
    +(proposalDetails?.voteStart || '0') / 1000,
    id,
    status === ProposalState.ACTIVE
  )

  // only show voting if user has > 0 votes at proposal start block and proposal is active,
  const showVotingButtons =
    !!availableVotes &&
    JSBI.greaterThan(availableVotes.quotient, JSBI.BigInt(0)) &&
    !!proposalDetails &&
    status === ProposalState.ACTIVE &&
    !!account &&
    !hasVoted

  const {
    collectionStartedResponse,
    collectionFinishedResponse,
    loading: collectionStatusLoading,
  } = useCollectionStatus(id)

  const showRequestCollectionsButton = Boolean(
    isHubChainActive &&
      account &&
      (status === ProposalState.SUCCEEDED || status === ProposalState.DEFEATED) &&
      !collectionStartedResponse
  )

  const showCancelButton = !!account && account === proposalDetails?.proposer && status === ProposalState.PENDING

  const collectionPhaseInProgress = Boolean(
    account && status === ProposalState.COLLECTION_PHASE && collectionStartedResponse && !collectionFinishedResponse
  )

  const showQueueButton =
    isHubChainActive && !!account && status === ProposalState.SUCCEEDED && !!collectionFinishedResponse

  const showExecuteButton = isHubChainActive && !!account && status === ProposalState.QUEUED

  const uniBalance: CurrencyAmount<Token> | undefined = useTokenBalance(
    account ?? undefined,
    chainId ? UNI[chainId] : undefined
  )
  const { userDelegatee }: { userDelegatee: string; isLoading: boolean } = useUserDelegatee()

  // in blurb link to home page if they are able to unlock
  const showLinkForUnlock = Boolean(
    uniBalance && JSBI.notEqual(uniBalance.quotient, JSBI.BigInt(0)) && userDelegatee === ZERO_ADDRESS
  )

  const executionData = {
    targets: proposalDetails?.targets ?? [],
    values: proposalDetails?.values ?? [],
    calldatas: proposalDetails?.calldatas ?? [],
    descriptionHash: proposalDetails?.descriptionHash ?? '',
  }

  useEffect(() => {
    async function getProposalStatus() {
      if (id && govHubContract) {
        const [status] = await govHubContract.functions.state(id, {})
        setStatus(status)
      }
    }

    getProposalStatus()
  }, [id, govHubContract])

  useEffect(() => {
    const checkAndFetchMarkdown = async () => {
      const description = proposalDetails?.description
      if (description) {
        try {
          const url = new URL(description)
          // Check if the URL ends with `.md`
          // Workaround for solving 21334436608831155290313754869298803265693554468267158113436859312488223664812 issue with URL
          if (url.pathname.endsWith('.md') || url.pathname.endsWith('ad320253537688190aacba690679d3e2/raw')) {
            // Fetch the Markdown file
            const response = await fetch(url.toString())
            if (response.ok) {
              const fileContent = await response.text()
              setMarkdownContent(fileContent) // Store the content for rendering
            } else {
              console.error('Failed to fetch file from URL:', response.statusText)
            }
          } else {
            // If not an `.md` file, treat it as plain text or fallback
            setMarkdownContent(description)
          }
        } catch (e) {
          console.error('Error processing description:', e)
          setMarkdownContent(description) // Fallback to plain text
        }
      }
    }

    if (proposalDetails?.description) {
      checkAndFetchMarkdown()
    }
  }, [proposalDetails?.description])

  if (!proposalDetails) return null

  return (
    <>
      <PageWrapper gap="lg" justify="center">
        <CancelModal
          isOpen={showCancelModal}
          onDismiss={toggleCancelModal}
          proposalId={proposalDetails?.proposalId}
          proposalExecutionData={executionData}
        />
        <VoteModal
          isOpen={showVoteModal}
          onDismiss={toggleVoteModal}
          proposalId={proposalDetails?.proposalId}
          voteOption={voteOption}
          availableVotes={availableVotes}
          id={id}
        />
        <DelegateModal isOpen={showDelegateModal} onDismiss={toggleDelegateModal} title={<Trans>Unlock Votes</Trans>} />
        <RequestCollectionsModal
          isOpen={showRequestCollectionsModal}
          onDismiss={toggleRequestCollectionsModal}
          proposalId={id}
        />
        <QueueModal
          isOpen={showQueueModal}
          onDismiss={toggleQueueModal}
          proposalId={proposalDetails?.proposalId}
          proposalExecutionData={executionData}
        />
        <ExecuteModal
          isOpen={showExecuteModal}
          onDismiss={toggleExecuteModal}
          proposalId={proposalDetails?.proposalId}
          proposalExecutionData={executionData}
        />
        <ProposalInfo gap="lg" justify="start">
          <RowBetween style={{ width: '100%' }}>
            <ArrowWrapper to="/">
              <Trans>
                <ArrowLeft size={20} /> Proposals
              </Trans>
            </ArrowWrapper>
            {proposalDetails && <ProposalStatus status={status} />}
          </RowBetween>
          <StyledTitleAutoColumn gap="10px">
            <ThemedText.SubHeaderLarge style={{ marginBottom: '.5rem' }}>
              {proposalDetails?.title}
            </ThemedText.SubHeaderLarge>
            {proposalDetails?.voteStart > now && status === ProposalState.PENDING && (
              <RowBetween>
                <ThemedText.DeprecatedMain>Voting starts approximately {startDate}</ThemedText.DeprecatedMain>
              </RowBetween>
            )}
            {proposalDetails?.voteEnd > now && status === ProposalState.ACTIVE && (
              <RowBetween>
                <ThemedText.DeprecatedMain>Voting ends approximately {endDate}</ThemedText.DeprecatedMain>
              </RowBetween>
            )}
            {proposalDetails && status === ProposalState.ACTIVE && !showVotingButtons && !hasVoted && account && (
              <GrayCard>
                <Box>
                  <WarningCircleIcon />
                </Box>
                Only vHMT votes that were self delegated before block {endDate} are eligible for voting.
                {showLinkForUnlock && (
                  <span>
                    <Trans>
                      <StyledInternalLink to="/vote">Unlock voting</StyledInternalLink> to prepare for the next
                      proposal.
                    </Trans>
                  </span>
                )}
              </GrayCard>
            )}
            {proposalDetails && hasVoted && account && (
              <GrayCard>
                <Box>
                  <WarningCircleIcon />
                </Box>
                <Trans>You have already voted for this proposal.</Trans>
              </GrayCard>
            )}
            {proposalDetails && !account && (
              <GrayCard>
                <Box>
                  <WarningCircleIcon />
                </Box>
                <Trans>Please connect a wallet with delegated voting power.</Trans>
              </GrayCard>
            )}
          </StyledTitleAutoColumn>

          {status > 0 && (
            <VotingButtons
              forVotes={forVotes}
              againstVotes={againstVotes}
              abstainVotes={abstainVotes}
              setVoteOption={setVoteOption}
              showVotingButtons={showVotingButtons}
              proposalStatus={status}
              loading={loading}
            />
          )}

          {showCancelButton && (
            <ButtonPrimary onClick={() => toggleCancelModal()} disabled={!cancelCallback}>
              <Trans>Cancel</Trans>
            </ButtonPrimary>
          )}

          {showRequestCollectionsButton && !collectionStatusLoading && (
            <ButtonPrimary
              onClick={() => toggleRequestCollectionsModal()}
              disabled={collectionPhaseInProgress || collectionStatusLoading}
            >
              {collectionPhaseInProgress ? (
                <Trans>Collection phase in progress</Trans>
              ) : (
                <Trans>Request Collection</Trans>
              )}
            </ButtonPrimary>
          )}

          {showQueueButton && (
            <RowFixed style={{ width: '100%', gap: '12px' }}>
              <ButtonPrimary
                padding="8px"
                onClick={() => {
                  toggleQueueModal()
                }}
              >
                <Trans>Queue</Trans>
              </ButtonPrimary>
            </RowFixed>
          )}
          {showExecuteButton && (
            <>
              <RowFixed style={{ width: '100%', gap: '12px' }}>
                <ButtonPrimary
                  padding="8px"
                  onClick={() => {
                    toggleExecuteModal()
                  }}
                >
                  <Trans>Execute</Trans>
                </ButtonPrimary>
              </RowFixed>
            </>
          )}
          <CardWrapper display={status > 0 ? 'block' : 'none'}>
            <StyledDataCard>
              <CardSection>
                <AutoColumn gap="md">
                  <WrapSmall>
                    <ThemedText.BodyPrimary fontSize={14}>
                      <Trans>Quorum</Trans>
                    </ThemedText.BodyPrimary>
                    {proposalDetails ? (
                      <ThemedText.BodyPrimary fontSize={14}>
                        {totalVotes}
                        <span>{` / ${quorumNumber ? quorumNumber : '-'}`}</span>
                      </ThemedText.BodyPrimary>
                    ) : (
                      '-'
                    )}
                  </WrapSmall>
                </AutoColumn>
                <ProgressWrapper>
                  <Progress percentageString={`${quorumPercentage ?? 0}%`} />
                </ProgressWrapper>
              </CardSection>
            </StyledDataCard>
          </CardWrapper>
          <AutoColumn gap="md">
            <ThemedText.SubHeaderLarge>
              <Trans>Description</Trans>
            </ThemedText.SubHeaderLarge>
            <MarkDownWrapper>
              <ReactMarkdown components={{ image: MarkdownImage }}>{markdownContent}</ReactMarkdown>
            </MarkDownWrapper>
          </AutoColumn>
          <AutoColumn gap="md">
            <ThemedText.SubHeaderLarge>
              <Trans>Proposer</Trans>
            </ThemedText.SubHeaderLarge>
            <ProposerAddressLink
              href={
                proposalDetails?.proposer && chainId
                  ? getExplorerLink(chainId, proposalDetails?.proposer, ExplorerDataType.ADDRESS)
                  : ''
              }
            >
              <ReactMarkdown>{proposalDetails?.proposer}</ReactMarkdown>
            </ProposerAddressLink>
          </AutoColumn>
        </ProposalInfo>
      </PageWrapper>
    </>
  )
}
