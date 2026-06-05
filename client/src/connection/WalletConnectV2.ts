import EthereumProvider, { EthereumProviderOptions } from '@walletconnect/ethereum-provider'
import { Actions, Connector } from '@web3-react/types'
import { L1_CHAIN_IDS, L2_CHAIN_IDS } from 'constants/chains'
import { Z_INDEX } from 'theme/zIndex'

import { RPC_URLS } from '../constants/networks'

const getWalletConnectMetadata = () => ({
  name: 'Human Governance',
  description: 'Human Protocol Governance',
  url: window.location.origin,
  icons: [`${window.location.origin}/favicon.png`],
})

// Avoid testing for the best URL by only passing a single URL per chain.
// Otherwise, WC will not initialize until all URLs have been tested (see getBestUrl in web3-react).
const RPC_URLS_WITHOUT_FALLBACKS = Object.entries(RPC_URLS).reduce(
  (map, [chainId, urls]) => ({
    ...map,
    [chainId]: urls[0],
  }),
  {}
)

interface WalletConnectV2ConstructorArgs {
  actions: Actions
  defaultChainId: number
  qrcode?: boolean
  onError?: (error: Error) => void
}

const parseChainId = (chainId: string | number) =>
  typeof chainId === 'number' ? chainId : Number.parseInt(chainId, chainId.startsWith('0x') ? 16 : 10)

type WalletConnectModal = {
  open?: (options?: { uri?: string; view?: 'ConnectingWalletConnectBasic' }) => Promise<void> | void
}

export class WalletConnectV2 extends Connector {
  ANALYTICS_EVENT = 'Wallet Connect QR Scan'
  provider: EthereumProvider | undefined = undefined

  private defaultChainId: number
  private eagerConnection?: Promise<EthereumProvider>
  private readonly qrcode: boolean

  constructor({ actions, defaultChainId, qrcode = true, onError }: WalletConnectV2ConstructorArgs) {
    super(actions, onError)
    this.defaultChainId = defaultChainId
    this.qrcode = qrcode
  }

  setDefaultChainId(chainId?: number) {
    if (chainId) this.defaultChainId = chainId
  }

  private getProviderOptions(chainId = this.defaultChainId): EthereumProviderOptions {
    const darkmode = Boolean(window.matchMedia('(prefers-color-scheme: dark)'))

    return {
      projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID as string,
      chains: [chainId],
      optionalChains: [...L1_CHAIN_IDS, ...L2_CHAIN_IDS],
      showQrModal: this.qrcode,
      metadata: getWalletConnectMetadata(),
      telemetryEnabled: false,
      customStoragePrefix: 'human-governance-walletconnect',
      rpcMap: RPC_URLS_WITHOUT_FALLBACKS,
      // as of 6/16/2023 there are no docs for `optionalMethods`
      // this set of optional methods fixes a bug we encountered where permit2 signatures were never received from the connected wallet
      // source: https://uniswapteam.slack.com/archives/C03R5G8T8BH/p1686858618164089?thread_ts=1686778867.145689&cid=C03R5G8T8BH
      optionalMethods: ['eth_signTypedData', 'eth_signTypedData_v4', 'eth_sign'],
      qrModalOptions: {
        desktopWallets: undefined,
        enableExplorer: false,
        explorerExcludedWalletIds: undefined,
        explorerRecommendedWalletIds: 'NONE',
        mobileWallets: undefined,
        privacyPolicyUrl: undefined,
        termsOfServiceUrl: undefined,
        themeMode: darkmode ? 'dark' : 'light',
        themeVariables: {
          '--wcm-font-family': '"Inter custom", sans-serif',
          '--wcm-z-index': Z_INDEX.modal.toString(),
        },
        walletImages: undefined,
      },
    }
  }

  private disconnectListener = (error?: Error) => {
    this.actions.resetState()
    if (error) this.onError?.(error)
  }

  private chainChangedListener = (chainId: string | number) => {
    this.actions.update({ chainId: parseChainId(chainId) })
  }

  private accountsChangedListener = (accounts: string[]) => {
    this.actions.update({ accounts })
  }

  private displayUriListener = (uri: string) => {
    const modal = this.provider?.modal as WalletConnectModal | undefined

    modal?.open?.({
      uri,
      view: 'ConnectingWalletConnectBasic',
    })
  }

  private async initialize(chainId = this.defaultChainId) {
    if (this.eagerConnection) return this.eagerConnection

    this.eagerConnection = EthereumProvider.init(this.getProviderOptions(chainId)).then((provider) => {
      this.provider = provider
      provider
        .on('disconnect', this.disconnectListener)
        .on('chainChanged', this.chainChangedListener)
        .on('accountsChanged', this.accountsChangedListener)
        .on('display_uri', this.displayUriListener)

      return provider
    })

    return this.eagerConnection
  }

  async connectEagerly() {
    const cancelActivation = this.actions.startActivation()

    try {
      const provider = await this.initialize()
      if (!provider.session) throw new Error('No active session found. Connect your wallet first.')

      this.actions.update({ accounts: provider.accounts, chainId: provider.chainId })
    } catch (error) {
      await this.deactivate()
      cancelActivation()
      throw error
    }
  }

  async activate(chainId = this.defaultChainId) {
    const provider = await this.initialize(chainId)

    if (provider.session) {
      if (!chainId || chainId === provider.chainId) return

      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
      return
    }

    const cancelActivation = this.actions.startActivation()

    try {
      await provider.enable()
      this.actions.update({ chainId: provider.chainId, accounts: provider.accounts })
    } catch (error) {
      await this.deactivate()
      cancelActivation()
      throw error
    }
  }

  async deactivate() {
    this.provider
      ?.removeListener('disconnect', this.disconnectListener)
      .removeListener('chainChanged', this.chainChangedListener)
      .removeListener('accountsChanged', this.accountsChangedListener)
      .removeListener('display_uri', this.displayUriListener)
      .disconnect()

    this.provider = undefined
    this.eagerConnection = undefined
    this.actions.resetState()
  }
}
