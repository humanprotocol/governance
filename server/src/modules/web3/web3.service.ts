import { Injectable } from '@nestjs/common';
import { Provider, ethers } from 'ethers';
import { NetworkConfigService } from '../../common/config/network-config.service';

@Injectable()
export class Web3Service {
  private providers: { [key: number]: Provider } = {};

  constructor(private networkConfigService: NetworkConfigService) {
    for (const network of this.networkConfigService.networks) {
      this.providers[network.chainId] = new ethers.JsonRpcProvider(
        network.rpcUrl,
      );
    }
  }

  getProvider(chainId: number): Provider {
    return this.providers[chainId];
  }
}
