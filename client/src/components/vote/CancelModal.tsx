import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import GrayCloseButton from 'components/GrayCloseButton/GrayCloseButton'
import { useIsMobile } from 'nft/hooks'
import { useState } from 'react'
import { ArrowUpCircle, X } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'

import Circle from '../../assets/images/blue-loader.svg'
import { ProposalExecutionData, useCancelCallback } from '../../state/governance/hooks'
import { CustomLightSpinner, ThemedText } from '../../theme'
import { ExternalLink } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Modal from '../Modal'
import { Input as NumericalInput } from '../NumericalInput'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px;
`

const StyledClosed = styled(X)`
  :hover {
    cursor: pointer;
  }
`

const ConfirmOrLoadingWrapper = styled.div`
  width: 100%;
  padding: 24px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding-top: 16px;
`

interface CancelModalProps {
  isOpen: boolean
  onDismiss: () => void
  proposalId: string | undefined // id for the proposal to queue
  proposalExecutionData: ProposalExecutionData | undefined
}

export default function CancelModal({ isOpen, onDismiss, proposalId, proposalExecutionData }: CancelModalProps) {
  const { chainId } = useWeb3React()
  const cancelCallback = useCancelCallback()
  const isMobile = useIsMobile()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState<boolean>(false)
  const [amount, setAmount] = useState(0.025)
  const [error, setError] = useState('')

  // get theme for colors
  const theme = useTheme()

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  const handleInputChange = (input: string) => {
    if (error) {
      setError('')
    }
    setAmount(Number(input))
  }

  async function onCancelProposal() {
    setError('')
    setAttempting(true)

    // if callback not returned properly ignore
    if (!cancelCallback) return

    // try delegation and store hash
    try {
      const hash = await cancelCallback(proposalId, proposalExecutionData, amount)
      setHash(hash)
    } catch (error) {
      setError('Tx failed, try changing the amount')
      setAttempting(false)
      console.log(error)
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <GrayCloseButton onClick={wrappedOnDismiss} />
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <ThemedText.DeprecatedMediumHeader fontWeight={500}>
                <Trans>Cancel Proposal</Trans>
              </ThemedText.DeprecatedMediumHeader>
              <StyledClosed onClick={wrappedOnDismiss} />
            </RowBetween>
            <RowBetween>
              <ThemedText.DeprecatedMediumHeader fontWeight={500} fontSize={14}>
                <Trans>Amount in ETH to fund cross-chain operations</Trans>
              </ThemedText.DeprecatedMediumHeader>
              <NumericalInput value={amount} onUserInput={handleInputChange} />
            </RowBetween>
            {error && <ThemedText.DeprecatedSubHeader color="accentFailure">{error}</ThemedText.DeprecatedSubHeader>}
            <ButtonPrimary onClick={onCancelProposal}>
              <ThemedText.DeprecatedMediumHeader color="white">
                <Trans>Cancel proposal</Trans>
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <ConfirmOrLoadingWrapper>
          <GrayCloseButton onClick={wrappedOnDismiss} />
          <RowBetween>
            <div />
            <StyledClosed onClick={wrappedOnDismiss} />
          </RowBetween>
          <ConfirmedIcon>
            <CustomLightSpinner src={Circle} alt="loader" size={isMobile ? '90px' : '116px'} />
          </ConfirmedIcon>
          <AutoColumn gap={isMobile ? '24px' : '48px'} justify="center">
            <AutoColumn gap="md" justify="center">
              <ThemedText.DeprecatedLargeHeader
                marginTop={32}
                fontSize={isMobile ? 20 : 36}
                fontWeight={isMobile ? 500 : 600}
              >
                <Trans>Processing</Trans>
              </ThemedText.DeprecatedLargeHeader>
            </AutoColumn>
            <ThemedText.DeprecatedSubHeader>
              <Trans>Confirm this transaction in your wallet</Trans>
            </ThemedText.DeprecatedSubHeader>
          </AutoColumn>
        </ConfirmOrLoadingWrapper>
      )}
      {hash && (
        <ConfirmOrLoadingWrapper>
          <GrayCloseButton onClick={wrappedOnDismiss} />
          <RowBetween>
            <div />
            <StyledClosed onClick={wrappedOnDismiss} />
          </RowBetween>
          <ConfirmedIcon>
            <ArrowUpCircle strokeWidth={0.7} size={isMobile ? 116 : 190} color={theme.accentAction} />
          </ConfirmedIcon>
          <AutoColumn gap={isMobile ? '24px' : '48px'} justify="center">
            <AutoColumn gap="md" justify="center">
              <ThemedText.DeprecatedLargeHeader
                width="100%"
                textAlign="center"
                marginTop={32}
                fontSize={isMobile ? 20 : 36}
                fontWeight={isMobile ? 500 : 600}
              >
                <Trans>Transaction Submitted</Trans>
              </ThemedText.DeprecatedLargeHeader>
            </AutoColumn>
            {chainId && (
              <ExternalLink
                href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}
                style={{ marginLeft: '4px' }}
              >
                <ThemedText.DeprecatedSubHeader>
                  <Trans>View transaction on Explorer</Trans>
                </ThemedText.DeprecatedSubHeader>
              </ExternalLink>
            )}
          </AutoColumn>
        </ConfirmOrLoadingWrapper>
      )}
    </Modal>
  )
}
