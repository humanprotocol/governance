import EthereumProvider, { EthereumProviderOptions } from '@walletconnect/ethereum-provider'
import { Actions, Connector } from '@web3-react/types'
import { L1_CHAIN_IDS, L2_CHAIN_IDS } from 'constants/chains'

import { RPC_URLS } from '../constants/networks'

const { createAppKit } = require('@reown/appkit/core')

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

type WalletConnectProviderWithModal = EthereumProvider & {
  modal?: unknown
  rpc: {
    chains: string[]
    optionalChains: string[]
    showQrModal: boolean
  }
}

const createAppKitNetwork = (caipNetworkId: string) => {
  const [chainNamespace, chainId] = caipNetworkId.split(':')

  return {
    id: chainId,
    caipNetworkId,
    chainNamespace,
    name: '',
    nativeCurrency: {
      name: '',
      symbol: '',
      decimals: 8,
    },
    rpcUrls: {
      default: {
        http: ['https://rpc.walletconnect.org/v1'],
      },
    },
  }
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
    return {
      projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID as string,
      chains: [chainId],
      optionalChains: [...L1_CHAIN_IDS, ...L2_CHAIN_IDS],
      showQrModal: false,
      metadata: getWalletConnectMetadata(),
      telemetryEnabled: false,
      logger: 'silent',
      customStoragePrefix: 'human-governance-walletconnect',
      rpcMap: RPC_URLS_WITHOUT_FALLBACKS,
      // as of 6/16/2023 there are no docs for `optionalMethods`
      // this set of optional methods fixes a bug we encountered where permit2 signatures were never received from the connected wallet
      // source: https://uniswapteam.slack.com/archives/C03R5G8T8BH/p1686858618164089?thread_ts=1686778867.145689&cid=C03R5G8T8BH
      optionalMethods: ['eth_signTypedData', 'eth_signTypedData_v4', 'eth_sign'],
    }
  }

  private attachAppKitModal(provider: EthereumProvider) {
    if (!this.qrcode) return

    const walletConnectProvider = provider as WalletConnectProviderWithModal
    const networks = [...new Set([...walletConnectProvider.rpc.chains, ...walletConnectProvider.rpc.optionalChains])]
      .map(createAppKitNetwork)
      .filter(Boolean)

    walletConnectProvider.modal = createAppKit({
      projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID as string,
      networks,
      metadata: getWalletConnectMetadata(),
      universalProvider: provider.signer,
      manualWCControl: true,
      enableMobileFullScreen: true,
      enableEIP6963: false,
      enableInjected: false,
      enableCoinbase: true,
      enableWalletConnect: true,
      showWallets: true,
      features: {
        email: false,
        socials: false,
        analytics: false,
      },
    })
    walletConnectProvider.rpc.showQrModal = true
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

  private async initialize(chainId = this.defaultChainId) {
    if (this.eagerConnection) return this.eagerConnection

    this.eagerConnection = EthereumProvider.init(this.getProviderOptions(chainId)).then((provider) => {
      this.provider = provider
      this.attachAppKitModal(provider)
      provider
        .on('disconnect', this.disconnectListener)
        .on('chainChanged', this.chainChangedListener)
        .on('accountsChanged', this.accountsChangedListener)

      return provider
    })

    return this.eagerConnection
  }

  async connectEagerly() {
    const cancelActivation = this.actions.startActivation()
    let provider: EthereumProvider

    try {
      provider = await this.initialize()
    } catch (error) {
      await this.deactivate()
      cancelActivation()
      throw error
    }

    if (!provider.session) {
      cancelActivation()
      throw new Error('No active session found. Connect your wallet first.')
    }

    this.actions.update({ accounts: provider.accounts, chainId: provider.chainId })
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
      await provider.signer.cleanupPendingPairings({ deletePairings: true }).catch(() => undefined)
      cancelActivation()
      throw error
    }
  }

  async deactivate() {
    this.provider
      ?.removeListener('disconnect', this.disconnectListener)
      .removeListener('chainChanged', this.chainChangedListener)
      .removeListener('accountsChanged', this.accountsChangedListener)

    if (this.provider?.session) {
      await this.provider.disconnect()
    } else {
      await this.provider?.signer.cleanupPendingPairings({ deletePairings: true }).catch(() => undefined)
    }

    this.provider = undefined
    this.eagerConnection = undefined
    this.actions.resetState()
  }
}
