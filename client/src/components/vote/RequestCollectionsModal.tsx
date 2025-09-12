import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import GrayCloseButton from 'components/GrayCloseButton/GrayCloseButton'
import { useIsMobile } from 'nft/hooks'
import { useState } from 'react'
import { ArrowUpCircle, X } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'

import Circle from '../../assets/images/blue-loader.svg'
import { useRequestCollections } from '../../state/governance/hooks'
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

interface RequestCollectionsModalProps {
  isOpen: boolean
  onDismiss: () => void
  proposalId: string | undefined // id for the proposal to queue
}

export default function RequestCollectionsModal({ isOpen, onDismiss, proposalId }: RequestCollectionsModalProps) {
  const { chainId } = useWeb3React()
  const requestCollectionsCallback = useRequestCollections()
  const isMobile = useIsMobile()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState<boolean>(false)
  const [amount, setAmount] = useState(0.05)
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

  async function onRequestCollections() {
    setError('')
    setAttempting(true)

    // if callback not returned properly ignore
    if (!requestCollectionsCallback) return

    // try delegation and store hash
    try {
      const hash = await requestCollectionsCallback(proposalId, amount)
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
                <Trans>Request Collections</Trans>
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
            <ButtonPrimary onClick={onRequestCollections}>
              <ThemedText.DeprecatedMediumHeader color="white">
                <Trans>Request collections</Trans>
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
