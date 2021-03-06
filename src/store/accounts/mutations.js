import {
  CHANGE_INIT_STATUS,
  SET_ADDRESS,
  ADD_WALLET,
  REMOVE_WALLETS,
  SET_HD_KEY,
  SET_BALANCE,
  SET_HD_CACHE_BY_TYPE,
} from './mutations-types';

const changeInitStatus = (state, status) => {
  state.isInited = status;
};

const setAddress = (state, address) => {
  state.address = address;
};

const addWallet = (state, wallet) => {
  state.wallets = {
    ...state.wallets,
    [wallet.address]: wallet,
  };
};

const removeWallets = state => {
  state.wallets = {};
  state.hdKey = null;
};

// Saves the encrypted HD wallet key in V3 keystore format
// Formerly addHdWallet
const setHdKey = (state, key) => {
  state.hdKey = key;
};

const setBalance = (state, balance) => {
  state.balance = balance;
};

const setHdCacheByType = (state, { xpub, v3KeyStore, walletType }) => {
  state.hdCacheByType[walletType] = {
    xpub,
    v3KeyStore,
  };
};

export default {
  [CHANGE_INIT_STATUS]: changeInitStatus,
  [SET_ADDRESS]: setAddress,
  [ADD_WALLET]: addWallet,
  [REMOVE_WALLETS]: removeWallets,
  [SET_HD_KEY]: setHdKey,
  [SET_BALANCE]: setBalance,
  [SET_HD_CACHE_BY_TYPE]: setHdCacheByType,
};
