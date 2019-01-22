jest.mock('@/class', () => {
  const web3 = require.requireActual('@/class/singleton/web3').default;
  const erc20 = require.requireActual('./erc20').default;
  const ens = require.requireActual('./ens').default;
  const proxies = require.requireActual('./proxies').default;
  const LocalStorage = require.requireActual('./localStorage').default;
  const dappBridge = require.requireActual('./dappBridge').default;
  const InpageProvider = require.requireActual('./InpageProvider').default;

  const originClass = require.requireActual('@/class');
  const loadProxy = proxy => proxy;

  return {
    ...originClass,
    InpageProvider,
    dappBridge,
    proxies,
    loadProxy,
    LocalStorage,
    web3,
    ENSResolver: ens,
    ERC20Token: erc20,
  };
});