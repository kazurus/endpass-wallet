const hdKeyMnemonic = {
  // phrase: '', //BIP39 mnemonic
  // seed: '', //Derived from mnemonic phrase
  path: `m/44'/60'/0'/0`, //Derivation path
};
const infuraConf = {
  key: 'zU4GTAQ0LjJNKddbyztc'
};
const serviceThrottleTimeout = 2000;
const subscriptionsAPIInterval = 5000;
const subscriptionsBlockchainInterval = 3000;
const userAPIUrl = 'http://user-url-for-prod.com';

export default {
  hdKeyMnemonic,
  infuraConf,
  serviceThrottleTimeout,
  subscriptionsAPIInterval,
  subscriptionsBlockchainInterval,
  userAPIUrl,
};
