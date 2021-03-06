import HDKey from 'ethereumjs-wallet/hdkey';
import Web3 from 'web3';

import {
  address as addressAcc,
  nextAddresses,
  addressBytes,
  addressHdChild,
  addresses,
  email,
  v3password,
  mnemonic,
  v3,
  hdv3,
  privateKey,
  privateKeyString,
  checksumAddress,
  seed,
  encryptedMessage,
  generatedWalletData,
} from 'fixtures/accounts';
import {
  getPasswordRecoveryIdentifierResponse,
  successResponse,
  errorResponse,
} from 'fixtures/identity';
import keystoreHDWallet from '@endpass/utils/keystoreHDWallet';
import keystoreWallet from '@endpass/utils/keystoreWallet';
import proxies from 'mocks/class/proxies';
import { Wallet, NotificationError, web3 } from '@/class';
import actions from '@/store/accounts/actions';
import {
  SET_ADDRESS,
  ADD_WALLET,
  REMOVE_WALLETS,
  SET_HD_KEY,
  SET_BALANCE,
  CHANGE_INIT_STATUS,
  SET_HD_CACHE_BY_TYPE,
} from '@/store/accounts/mutations-types';
import userService from '@/services/user';
import localSettingsService from '@/services/localSettings';
import connect from '@/class/singleton/connect';

import { ENCRYPT_OPTIONS } from '@/constants';

const WALLET_TYPES = Wallet.getTypes();

describe('Accounts actions', () => {
  let dispatch;
  let commit;

  beforeEach(() => {
    jest.clearAllMocks();

    commit = jest.fn();
    dispatch = jest.fn();
  });

  describe('selectWallet', () => {
    const wallet = new Wallet(v3);
    const state = {
      wallets: {
        [checksumAddress]: wallet,
      },
    };
    const rootState = {
      user: {
        email,
      },
    };

    it('should set address, save meta, reset dapp, request balance tokens with selected address', async () => {
      expect.assertions(4);

      await actions.selectWallet(
        {
          state,
          commit,
          dispatch,
          rootState,
        },
        checksumAddress,
      );

      expect(commit).toHaveBeenCalledWith(SET_ADDRESS, checksumAddress);
      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenNthCalledWith(1, 'updateBalance');
      expect(dispatch).toHaveBeenNthCalledWith(2, 'updateAccountSettings');
    });
  });

  describe('addWallet', () => {
    it('should add wallet to the store', async () => {
      expect.assertions(3);

      const address = checksumAddress.toLowerCase();

      await actions.addWallet({ commit, dispatch }, { ...v3, address });

      expect(commit).toHaveBeenCalledTimes(1);
      expect(dispatch).not.toBeCalled();
      expect(commit).toHaveBeenNthCalledWith(1, ADD_WALLET, expect.any(Wallet));
    });

    it('should save the wallet through the user service', async () => {
      expect.assertions(3);

      const { address } = v3;

      await actions.addWallet({ commit, dispatch }, v3);

      expect(userService.setAccount).toHaveBeenCalledTimes(1);
      expect(userService.setAccount).toBeCalledWith(address, v3);
      expect(dispatch).toHaveBeenCalledTimes(0);
    });

    it('should handle errors from user service', async () => {
      expect.assertions(2);

      const error = new Error('error');
      userService.setAccount.mockRejectedValueOnce(error);

      await actions.addWallet({ commit, dispatch }, v3);

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toBeCalledWith('errors/emitError', error, {
        root: true,
      });
    });
  });

  describe('addPublicWallet', () => {
    const info = {
      address: checksumAddress,
      hidden: false,
      type: WALLET_TYPES.PUBLIC,
    };

    it('should save public key and select added wallet', async () => {
      expect.assertions(2);

      await actions.addPublicWallet(
        { commit, dispatch },
        { address: checksumAddress },
      );

      expect(dispatch).toBeCalledTimes(1);
      expect(dispatch).toHaveBeenNthCalledWith(1, 'addWalletAndSelect', {
        info,
        address: checksumAddress,
      });
    });

    it('should handle errors', async () => {
      expect.assertions(2);

      const error = new Error('error');
      dispatch.mockRejectedValueOnce(error);

      await actions.addPublicWallet({ commit, dispatch }, v3);

      expect(dispatch).toBeCalledTimes(2);
      expect(dispatch).toHaveBeenLastCalledWith('errors/emitError', error, {
        root: true,
      });
    });
  });

  describe('addWalletAndSelect', () => {
    it('should add wallet', async () => {
      expect.assertions(2);

      const address = checksumAddress.toLowerCase();
      const wallet = { ...v3, address };

      await actions.addWalletAndSelect({ dispatch }, wallet);

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenNthCalledWith(1, 'addWallet', wallet);
    });

    it('should select wallet', async () => {
      expect.assertions(2);

      const address = checksumAddress.toLowerCase();
      const wallet = { ...v3, address };

      await actions.addWalletAndSelect({ dispatch }, wallet);

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenLastCalledWith(
        'selectWallet',
        checksumAddress,
      );
    });

    it('should handle errors', async () => {
      expect.assertions(2);

      const error = new Error('error');
      dispatch.mockRejectedValueOnce(error);

      await actions.addWalletAndSelect({ commit, dispatch }, v3);

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenNthCalledWith(2, 'errors/emitError', error, {
        root: true,
      });
    });
  });

  describe('addWalletWithV3', () => {
    const walletPassword = 'walletPassword';

    it('should add wallet from v3 key store', async () => {
      expect.assertions(2);

      await actions.addWalletWithV3(
        { dispatch },
        {
          json: v3,
          jsonPassword: v3password,
          walletPassword,
        },
      );

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toBeCalledWith('addWalletWithPrivateKey', {
        privateKey: privateKeyString,
        password: walletPassword,
      });
    });

    it('should handle notification errors', async () => {
      expect.assertions(2);

      const error = new NotificationError({
        title: 'title',
        text: 'text',
      });
      const spy = jest
        .spyOn(Wallet.prototype, 'getPrivateKeyString')
        .mockImplementation(() => {
          throw error;
        });

      await actions.addWalletWithV3({ commit, dispatch }, { json: v3 });

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toBeCalledWith('errors/emitError', error, {
        root: true,
      });

      spy.mockRestore();
    });

    it('should handle errors without notifications', async () => {
      expect.assertions(2);

      const error = new Error('error');
      const spy = jest
        .spyOn(Wallet.prototype, 'getPrivateKeyString')
        .mockImplementation(() => {
          throw error;
        });

      try {
        await actions.addWalletWithV3({ commit, dispatch }, { json: v3 });
      } catch (e) {
        expect(e).toEqual(error);
        expect(dispatch).toHaveBeenCalledTimes(0);
      }

      spy.mockRestore();
    });
  });

  describe('addWalletWithPrivateKey', () => {
    it('should add wallet from private key', async () => {
      expect.assertions(2);

      await actions.addWalletWithPrivateKey(
        { dispatch },
        {
          privateKey: privateKeyString,
          password: v3password,
        },
      );

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toBeCalledWith(
        'addWalletAndSelect',
        expect.objectContaining({
          address: checksumAddress,
        }),
      );
    });

    it('should handle errors', async () => {
      expect.assertions(2);

      const error = new Error('error');
      const spy = jest
        .spyOn(keystoreWallet, 'encryptWallet')
        .mockImplementation(() => {
          throw error;
        });

      await actions.addWalletWithPrivateKey(
        { commit, dispatch },
        {
          privateKey: privateKeyString,
          password: v3password,
        },
      );

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toBeCalledWith('errors/emitError', error, {
        root: true,
      });

      spy.mockRestore();
    });
  });

  describe('addWalletWithPublicKey', () => {
    it('should add address from public key', async () => {
      expect.assertions(2);

      await actions.addWalletWithPublicKey(
        { commit, dispatch },
        checksumAddress,
      );

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenNthCalledWith(1, 'addWallet', {
        address: checksumAddress,
        info: { type: WALLET_TYPES.PUBLIC },
      });
    });

    it('should select wallet', async () => {
      expect.assertions(2);

      await actions.addWalletWithPublicKey({ dispatch }, checksumAddress);

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenNthCalledWith(
        2,
        'selectWallet',
        checksumAddress,
      );
    });

    it('should handle errors', async () => {
      expect.assertions(2);

      const error = new Error('error');

      dispatch.mockRejectedValueOnce(error);

      await actions.addWalletWithPublicKey(
        { commit, dispatch },
        checksumAddress,
      );

      expect(dispatch).toBeCalledTimes(2);
      expect(dispatch).toHaveBeenLastCalledWith('errors/emitError', error, {
        root: true,
      });
    });
  });

  describe('commitWallet', () => {
    const { commitWallet } = actions;
    const wallet = {
      address: checksumAddress,
    };
    const state = {
      wallet: {
        getAddressString: jest.fn().mockResolvedValue(),
      },
      wallets: {
        [checksumAddress]: null,
      },
    };

    it('should save HD wallet', async () => {
      expect.assertions(2);

      await commitWallet({ state, commit }, { wallet: hdv3 });

      expect(commit).toHaveBeenCalledTimes(1);
      expect(commit).toHaveBeenCalledWith(SET_HD_KEY, hdv3);
    });

    it('should save wallet', async () => {
      expect.assertions(2);

      await commitWallet({ state, commit }, { wallet: v3 });

      expect(commit).toBeCalledTimes(1);
      expect(commit).toBeCalledWith(ADD_WALLET, expect.any(Wallet));
    });

    it('should save public key', async () => {
      expect.assertions(2);

      await commitWallet({ state, commit }, { wallet });

      expect(commit).toHaveBeenCalledTimes(1);
      expect(commit).toHaveBeenCalledWith(ADD_WALLET, expect.any(Wallet));
    });

    // TODO: check this moment
    // it('should update active wallet', async () => {
    //   expect.assertions(2);

    //   state.wallet.getAddressString.mockResolvedValueOnce(checksumAddress);

    //   await commitWallet({ state, commit }, { wallet });

    //   expect(commit).toHaveBeenCalledTimes(2);
    //   expect(commit).toHaveBeenLastCalledWith(
    //     SET_WALLET,
    //     state.wallets[checksumAddress],
    //   );
    // });
  });

  describe('saveWallet', () => {
    const { saveWallet } = actions;
    const json = {
      address: 'address',
    };
    const info = {
      address: json.address,
    };

    beforeEach(() => {
      dispatch.mockClear();
    });

    it('should call userService.setAccount', async () => {
      expect.assertions(2);

      userService.setAccount = jest.fn();

      await saveWallet({ dispatch }, { json });

      expect(userService.setAccount).toHaveBeenCalledTimes(1);
      expect(userService.setAccount).toHaveBeenCalledWith(json.address, {
        info: {},
        ...json,
      });
    });

    it('should call commitWallet action', async () => {
      expect.assertions(2);

      await saveWallet({ dispatch }, { json, info });

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith('commitWallet', { wallet: json });
    });
  });

  describe('createNewWallet', () => {
    const getters = {
      getHdWalletBySeed: jest.fn(),
    };

    beforeEach(() => {
      connect.generateWallet = jest
        .fn()
        .mockReturnValueOnce(generatedWalletData);
    });

    it('should generate wallet', async () => {
      expect.assertions(1);

      const res = await actions.generateNewWallet({ dispatch });

      expect(res).toEqual(generatedWalletData);
    });

    it('should create and save wallet', async () => {
      expect.assertions(5);

      const expectedInfo = {
        address: hdv3.address,
        type: WALLET_TYPES.HD_MAIN,
        hidden: false,
      };

      const expectedJson = expect.objectContaining({
        address: hdv3.address,
      });

      dispatch.mockResolvedValueOnce(generatedWalletData);

      await actions.createNewWallet({ dispatch });

      expect(dispatch).toHaveBeenCalledTimes(3);
      expect(dispatch).toHaveBeenNthCalledWith(1, 'generateNewWallet');
      expect(dispatch).toHaveBeenNthCalledWith(2, 'saveWallet', {
        json: expectedJson,
        info: expectedInfo,
      });
      expect(dispatch).toHaveBeenNthCalledWith(3, 'addWalletAndSelect', v3);
      expect(userService.backupSeed).toBeCalledWith(encryptedMessage);
    });

    it('should handle errors', async () => {
      expect.assertions(3);

      const error = new Error('internal error');

      dispatch.mockRejectedValueOnce(error);

      try {
        await actions.createNewWallet({ dispatch, getters });
      } catch (e) {
        expect(e).toEqual(new Error("Can't create new wallet"));
      }

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenLastCalledWith('errors/emitError', error, {
        root: true,
      });
    });
  });

  describe('addHdChildWallets', () => {
    const getters = {
      cachedHdV3KeyStoreByType: () => hdv3,
    };

    it('should add wallets with balance and one more', async () => {
      expect.assertions(2);

      HDKey.getChecksumAddressString.mockReturnValueOnce(addressHdChild);
      HDKey.toV3.mockReturnValueOnce({});

      await actions.addHdChildWallets(
        { dispatch, getters },
        {
          password: v3password,
          address: addressHdChild,
          index: 1,
          type: WALLET_TYPES.HD_PUBLIC,
        },
      );

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenNthCalledWith(
        1,
        'addWalletAndSelect',
        expect.any(Object),
      );
    });

    it('should handle errors when wrong child address', async () => {
      expect.assertions(2);

      const error = new NotificationError({
        title: 'Add wallet',
        text:
          'Something goes wrong with during new wallet adding. Please try again.',
      });

      await actions.addHdChildWallets(
        { dispatch, getters },
        {
          password: v3password,
          address: 'wrongAddr',
          index: 0,
          type: WALLET_TYPES.HD_PUBLIC,
        },
      );

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith('errors/emitError', error, {
        root: true,
      });
    });

    it('should handle errors', async () => {
      expect.assertions(2);

      const wrongGetters = {
        cachedHdV3KeyStoreByType: () => null,
      };

      const error = new Error('Wallet is not in keystore V3 format!');

      await actions.addHdChildWallets(
        { dispatch, getters: wrongGetters },
        {
          password: v3password,
          address: addressHdChild,
          index: 0,
          type: WALLET_TYPES.HD_PUBLIC,
        },
      );

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith('errors/emitError', error, {
        root: true,
      });
    });
  });

  describe('addHdPublicWallet', () => {
    const { address: hdAddress } = hdv3;
    const getters = {
      getHdWalletBySeed: jest.fn(),
    };

    beforeEach(() => {
      web3.eth.getBalance = jest.fn().mockResolvedValueOnce('5');
      web3.eth.getBalance.mockResolvedValueOnce('0');

      keystoreHDWallet.encryptHDWallet = jest.fn().mockReturnValueOnce({
        address: hdAddress,
      });
    });

    it('should add wallets with balance and one more', async () => {
      expect.assertions(1);

      await actions.addHdPublicWallet(
        { dispatch, getters },
        { password: v3password, key: mnemonic },
      );

      expect(dispatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateWallets', () => {
    const walletAddress1 = 'wallet address 1';
    const walletAddress2 = 'wallet address 2';
    const wallet1 = { address: walletAddress1 };
    const wallet2 = { address: walletAddress2 };
    const wallets = {
      [walletAddress1]: wallet1,
      [walletAddress2]: wallet2,
    };

    it('should call userService.updateAccounts', async () => {
      expect.assertions(2);

      userService.updateAccounts = jest.fn();

      await actions.updateWallets({ dispatch }, { wallets });

      expect(userService.updateAccounts).toHaveBeenCalledTimes(1);
      expect(userService.updateAccounts).toHaveBeenCalledWith(wallets);
    });

    it('should call commitWallet actions', async () => {
      expect.assertions(1);

      userService.updateAccounts = jest
        .fn()
        .mockResolvedValue({ success: true });

      await actions.updateWallets({ dispatch }, { wallets });

      expect(dispatch.mock.calls).toEqual([
        ['commitWallet', { wallet: wallet1 }],
        ['commitWallet', { wallet: wallet2 }],
      ]);
    });

    it('should handle errors', async () => {
      expect.assertions(2);

      const error = new Error();

      userService.updateAccounts = jest.fn().mockRejectedValue(error);

      await actions.updateWallets({ dispatch }, { wallets });

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith('errors/emitError', error, {
        root: true,
      });
    });

    it('should return userService.updateAccounts response', async () => {
      let updateAccountsResponse = { success: true };
      let response;

      expect.assertions(2);

      userService.updateAccounts = jest
        .fn()
        .mockResolvedValue(updateAccountsResponse);
      response = await actions.updateWallets({ dispatch }, { wallets });

      expect(response).toEqual(updateAccountsResponse.success);

      updateAccountsResponse = { success: false };
      userService.updateAccounts.mockResolvedValue(updateAccountsResponse);
      response = await actions.updateWallets({ dispatch }, { wallets });

      expect(response).toEqual(updateAccountsResponse.success);
    });
  });

  describe('updateBalance', () => {
    let state;
    const balance = '5';

    beforeEach(() => {
      state = {
        address: checksumAddress,
      };
    });

    it('should set a new balance', async () => {
      expect.assertions(4);

      dispatch.mockResolvedValueOnce({
        tokens: [],
        balance,
      });

      await actions.updateBalance({ commit, dispatch, state });

      expect(commit).toHaveBeenCalledTimes(1);
      expect(commit).toBeCalledWith(SET_BALANCE, balance);
      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenLastCalledWith(
        'tokens/setTokensInfoByAddress',
        {
          tokens: [],
          address: addressAcc,
        },
        { root: true },
      );
    });

    it('should not update the balance if the address does not exist', async () => {
      expect.assertions(2);

      state = { address: null };

      await actions.updateBalance({ commit, dispatch, state });

      expect(commit).toHaveBeenCalledTimes(0);
      expect(dispatch).toHaveBeenCalledTimes(0);
    });

    it('should handle errors', async () => {
      expect.assertions(2);

      const error = new Error('error');

      dispatch.mockRejectedValueOnce(error);

      await actions.updateBalance({ dispatch, state });

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toBeCalledWith('errors/emitError', error, {
        root: true,
      });
    });
  });

  describe('validatePassword', () => {
    let state;
    let getters;

    beforeEach(() => {
      state = {
        hdKey: hdv3,
      };
      getters = {
        wallet: {
          validatePassword: jest.fn().mockResolvedValue(true),
        },
        isPublicAccount: false,
      };
    });

    it('should validate the password with current wallet', async () => {
      expect.assertions(2);

      const isValid = await actions.validatePassword(
        { state, getters },
        v3password,
      );

      expect(getters.wallet.validatePassword).toHaveBeenCalledWith(v3password);
      expect(isValid).toBe(true);
    });

    it('should validate the password through the hdKey when the public account', async () => {
      expect.assertions(3);

      Wallet.prototype.validatePassword = jest.fn().mockResolvedValueOnce(true);
      Wallet.getAddressFromXpub = jest.fn(() => addressAcc);

      getters = { ...getters, isPublicAccount: true };

      const isValid = await actions.validatePassword(
        { state, getters },
        v3password,
      );

      expect(getters.wallet.validatePassword).not.toBeCalled();
      expect(Wallet.prototype.validatePassword).toBeCalledWith(v3password);
      expect(isValid).toBe(true);
    });

    it('should throw an error if the password is incorrect', async () => {
      expect.assertions(1);

      const error = new Error('error');

      getters.wallet.validatePassword.mockRejectedValueOnce(error);

      try {
        await actions.validatePassword({ state, getters }, v3password);
      } catch (e) {
        expect(e).toEqual(error);
      }
    });
  });

  describe('setUserHdKey', () => {
    it('should set the hd key to the store', async () => {
      expect.assertions(3);

      await actions.setUserHdKey({ commit, dispatch });

      expect(commit).toHaveBeenCalledTimes(2);
      expect(commit).toBeCalledWith(SET_HD_KEY, hdv3);
      expect(commit).toBeCalledWith(SET_HD_CACHE_BY_TYPE, {
        xpub: hdv3.address,
        v3KeyStore: hdv3,
        walletType: WALLET_TYPES.HD_MAIN,
      });
    });

    it('should handle errors', async () => {
      expect.assertions(2);

      const error = new Error('error');
      userService.getHDKey.mockRejectedValueOnce(error);

      await actions.setUserHdKey({ commit, dispatch });

      expect(dispatch).toBeCalledTimes(1);
      expect(dispatch).toBeCalledWith('errors/emitError', error, {
        root: true,
      });
    });
  });

  describe('init', () => {
    it('should set the hd key and user accounts to the store', async () => {
      expect.assertions(4);

      await actions.init({ commit, dispatch });

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenNthCalledWith(1, 'setUserHdKey');
      expect(dispatch).toHaveBeenNthCalledWith(2, 'setUserWallets');
      expect(commit).toHaveBeenCalledWith(CHANGE_INIT_STATUS, true);
    });

    it('should handle errors', async () => {
      expect.assertions(2);

      const error = new Error('error');

      dispatch.mockRejectedValueOnce(error);

      await actions.init({ dispatch, commit });

      expect(dispatch).toHaveBeenCalledTimes(3);
      expect(dispatch).toHaveBeenLastCalledWith('errors/emitError', error, {
        root: true,
      });
    });
  });

  describe('setUserWallets', () => {
    const rootState = {
      user: {
        email,
      },
    };

    it('should request user accounts and save it to the store', async () => {
      expect.assertions(5);

      await actions.setUserWallets({ commit, dispatch, rootState });

      expect(userService.getV3Accounts).toBeCalledTimes(1);
      expect(commit).toBeCalledTimes(1);
      expect(commit).toBeCalledWith(ADD_WALLET, expect.any(Wallet));
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith('selectWallet', checksumAddress);
    });

    it('should not do anything if response does not contains any accounts', async () => {
      expect.assertions(2);

      userService.getV3Accounts.mockResolvedValueOnce([]);

      await actions.setUserWallets({ commit, dispatch, rootState });

      expect(commit).not.toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('should handle error', async () => {
      expect.assertions(3);

      const error = new Error();

      userService.getV3Accounts.mockRejectedValueOnce(error);

      await actions.setUserWallets({ commit, dispatch, rootState });

      expect(commit).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith('errors/emitError', error, {
        root: true,
      });
    });
  });

  describe('getNextWalletsFromHd', () => {
    const payload = {
      walletType: WALLET_TYPES.HD_PUBLIC,
    };

    const getters = {
      cachedXpubByType: () => hdv3.address,
    };

    const state = {
      hdCacheByType: {
        [WALLET_TYPES.HD_PUBLIC]: {
          xpub: hdv3.address,
        },
      },
    };

    it('should save xpub if saved xpub is not eqials to received with given params', async () => {
      expect.assertions(2);

      proxies.HDProxy.getNextWallets.mockImplementation(() => ({
        xpub: 'other',
        addresses,
      }));

      const res = await actions.getNextWalletsFromHd(
        { state, dispatch, getters },
        payload,
      );

      expect(dispatch).toBeCalledWith('saveToCache', {
        xpub: 'other',
        walletType: WALLET_TYPES.HD_PUBLIC,
      });
      expect(res).toBe(addresses);
    });

    it('should not save xpub if current xpub is equals to received xpub from service', async () => {
      expect.assertions(1);

      proxies.HDProxy.getNextWallets.mockImplementation(() => ({
        xpub: hdv3.address,
        addresses,
      }));
      await actions.getNextWalletsFromHd({ state, dispatch, getters }, payload);

      expect(dispatch).not.toBeCalled();
    });

    it('should handle error for wrong wallet type', async () => {
      expect.assertions(2);

      const error = new NotificationError({
        title: 'Access error',
        text:
          'An error occurred while getting access to hardware device. Please, try again.',
        type: 'is-danger',
      });

      try {
        await actions.getNextWalletsFromHd(
          { state, dispatch, getters },
          { walletType: 'wrongType' },
        );
      } catch (e) {
        expect(e).toEqual(error);
      }

      expect(dispatch).not.toBeCalled();
    });
  });

  describe('saveToCache', () => {
    it('should set hardware xpub and set account with user service', async () => {
      expect.assertions(2);

      const payload = {
        walletType: 'foo',
        xpub: 'baz',
      };

      await actions.saveToCache({ commit }, payload);

      expect(commit).toBeCalledWith(SET_HD_CACHE_BY_TYPE, payload);
      expect(userService.setAccount).toBeCalledWith('baz', {
        info: {
          type: 'foo',
        },
      });
    });
  });

  describe('decryptAccountHdWallet', () => {
    it('should decrypt current account hd wallet with keystore and return it', async () => {
      expect.assertions(2);

      keystoreHDWallet.decryptHDWallet = jest.fn().mockReturnValueOnce('foo');

      const state = {
        hdKey: '0x0',
      };
      const res = await actions.decryptAccountHdWallet({ state }, 'password');

      expect(keystoreHDWallet.decryptHDWallet).toBeCalledWith(
        'password',
        '0x0',
      );
      expect(res).toBe('foo');
    });

    it('should not do anything if current account hdKey is empty and return null', async () => {
      expect.assertions(2);

      const state = {
        hdKey: null,
      };
      const res = await actions.decryptAccountHdWallet({ state }, 'password');

      expect(keystoreHDWallet.decryptHDWallet).not.toBeCalled();
      expect(res).toBe(null);
    });
  });

  describe('decryptAccountWallets', () => {
    it('should decrypt current account non-public wallets', async () => {
      expect.assertions(2);

      const state = {
        wallets: [
          {
            foo: 'bar',
            v3: '0x0',
            isPublic: true,
          },
          {
            bar: 'baz',
            v3: '0x1',
            isPublic: false,
          },
        ],
      };

      keystoreWallet.decryptWallet = jest.fn();

      await actions.decryptAccountWallets({ state }, 'password');

      expect(keystoreWallet.decryptWallet).toBeCalledTimes(1);
      expect(keystoreWallet.decryptWallet).toBeCalledWith('password', '0x1');
    });
  });

  describe('encryptHdWallet', () => {
    it('should encrypt given hd wallet', async () => {
      expect.assertions(1);

      const payload = {
        password: 'password',
        hdWallet: {
          foo: 'bar',
        },
      };

      await actions.encryptHdWallet(null, payload);

      expect(keystoreHDWallet.encryptHDWallet).toBeCalledWith(
        payload.password,
        payload.hdWallet,
        ENCRYPT_OPTIONS,
      );
    });

    it('should not do anything received hd wallet empty', async () => {
      expect.assertions(2);

      const res = await actions.encryptHdWallet(null, {});

      expect(keystoreHDWallet.encryptHDWallet).not.toBeCalled();
      expect(res).toBe(null);
    });
  });

  describe('encryptWallets', () => {
    it('should encrypt and returns given wallets', async () => {
      expect.assertions(2);

      keystoreWallet.encryptWallet = jest
        .fn()
        .mockImplementationOnce((pass, obj) => obj);

      const payload = {
        password: 'password',
        wallets: [
          {
            foo: 'bar',
          },
        ],
      };

      const res = await actions.encryptWallets(null, payload, ENCRYPT_OPTIONS);

      expect(keystoreWallet.encryptWallet).toBeCalledWith(
        payload.password,
        payload.wallets[0],
        ENCRYPT_OPTIONS,
      );
      expect(res).toEqual(payload.wallets);
    });
  });

  describe('reencryptAllAccountWallets', () => {
    it('should reencrypt all account wallets with new password', async () => {
      expect.assertions(6);

      const decryptedHdWallet = {
        foo: 'bar',
      };
      const decryptedWallets = [
        {
          bar: 'baz',
        },
      ];
      const enryptedHdWallet = {
        foo: '0x0',
      };
      const enryptedWallets = [
        {
          foo: '0x1',
        },
      ];

      dispatch.mockResolvedValueOnce(decryptedHdWallet);
      dispatch.mockResolvedValueOnce(decryptedWallets);
      dispatch.mockResolvedValueOnce(enryptedHdWallet);
      dispatch.mockResolvedValueOnce(enryptedWallets);

      const payload = {
        password: 'password',
        newPassword: 'newPassword',
      };

      const res = await actions.reencryptAllAccountWallets(
        { dispatch },
        payload,
      );

      expect(dispatch).toBeCalledTimes(4);
      expect(dispatch).toHaveBeenNthCalledWith(
        1,
        'decryptAccountHdWallet',
        payload.password,
      );
      expect(dispatch).toHaveBeenNthCalledWith(
        2,
        'decryptAccountWallets',
        payload.password,
      );
      expect(dispatch).toHaveBeenNthCalledWith(3, 'encryptHdWallet', {
        hdWallet: decryptedHdWallet,
        password: payload.newPassword,
      });
      expect(dispatch).toHaveBeenNthCalledWith(4, 'encryptWallets', {
        wallets: decryptedWallets,
        password: payload.newPassword,
      });
      expect(res).toEqual({
        hdWallet: enryptedHdWallet,
        wallets: enryptedWallets,
      });
    });
  });

  describe('updateWalletsWithNewPassword', () => {
    const payload = {
      password: 'password',
      newPassword: 'newPassword',
    };

    it('should reencrypt all account wallets and update them with new password', async () => {
      expect.assertions(3);

      const encryptedAccountWallets = {
        hdWallet: {
          address: '0x0',
        },
        wallets: [
          {
            address: '0x1',
          },
        ],
      };

      dispatch.mockResolvedValueOnce(encryptedAccountWallets);

      await actions.updateWalletsWithNewPassword({ dispatch }, payload);

      expect(dispatch).toBeCalledTimes(2);
      expect(dispatch).toHaveBeenNthCalledWith(
        1,
        'reencryptAllAccountWallets',
        payload,
      );
      expect(dispatch).toHaveBeenNthCalledWith(2, 'updateWallets', {
        wallets: {
          '0x0': {
            address: '0x0',
          },
          '0x1': {
            address: '0x1',
          },
        },
      });
    });

    it('should not do anything if account does not includes any wallets', async () => {
      expect.assertions(1);

      dispatch.mockResolvedValueOnce({
        hdWallet: null,
        wallets: [],
      });

      await actions.updateWalletsWithNewPassword({ dispatch }, payload);

      expect(dispatch).toBeCalledTimes(1);
    });
  });

  describe('recoverWalletsPassword', () => {
    const [mainAddress, standartAddress] = addresses;
    const password = 'password';
    const signature = 'signature';
    const hdWallet = HDKey.derivePath();
    const getters = {
      getHdWalletBySeed: jest.fn(() => hdWallet),
    };

    beforeEach(() => {
      HDKey.derivePath.mockClear();
      getters.getHdWalletBySeed.mockClear();
    });

    it('should check hdKey exists', async () => {
      expect.assertions(2);

      const state = {};
      const error = new NotificationError({
        title: 'Error recovering wallet password',
        text: 'Main HD wallet not found.',
        type: 'is-danger',
      });

      await actions.recoverWalletsPassword({ state, dispatch, getters }, {});

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith('errors/emitError', error, {
        root: true,
      });
    });

    it('should handle incorrect seed phrase', async () => {
      expect.assertions(2);

      const state = {
        hdKey: {},
      };
      const error = new NotificationError({
        title: 'Error recovering wallet password',
        text: 'Incorrect seed phrase.',
        type: 'is-danger',
      });

      HDKey.publicExtendedKey.mockReturnValueOnce(mainAddress);

      await actions.recoverWalletsPassword(
        { state, dispatch, getters },
        { seedPhrase: mnemonic },
      );

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith('errors/emitError', error, {
        root: true,
      });
    });

    it('should handle other errors', async () => {
      expect.assertions(2);

      const state = {
        hdKey: { address: mainAddress },
      };
      const error = new Error();

      HDKey.publicExtendedKey.mockReturnValueOnce(mainAddress);
      HDKey.getPrivateKey.mockReturnValueOnce(privateKey.data);
      dispatch.mockRejectedValueOnce(error);

      await actions.recoverWalletsPassword(
        { state, dispatch, getters },
        { seedPhrase: mnemonic },
      );

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenNthCalledWith(2, 'errors/emitError', error, {
        root: true,
      });
    });

    it('should successfully recover wallets password', async () => {
      expect.assertions(16);

      const wallet = HDKey.getWallet();
      const encryptedHdWallet = {};
      const encryptedWallets = [{}];
      const state = {
        hdKey: { address: mainAddress },
      };
      const successMessage = new NotificationError({
        title: 'The password is successfully recovered',
        text:
          'All keystore wallets have been deleted. They can be restored from a private key or seed phrase on the import page.',
        type: 'is-success',
      });

      HDKey.publicExtendedKey.mockReturnValueOnce(mainAddress);
      HDKey.getPrivateKey.mockReturnValueOnce(privateKey.data);
      HDKey.getAddress.mockReturnValueOnce(addressBytes);
      web3.eth.accounts.sign.mockResolvedValueOnce({ signature });
      dispatch.mockResolvedValueOnce(encryptedHdWallet);
      dispatch.mockResolvedValueOnce(encryptedWallets);
      userService.recoverWalletsPassword.mockResolvedValue(successResponse);

      await actions.recoverWalletsPassword(
        {
          state,
          dispatch,
          commit,
          getters,
        },
        { seedPhrase: mnemonic, password },
      );

      expect(getters.getHdWalletBySeed).toHaveBeenCalledTimes(1);
      expect(getters.getHdWalletBySeed).toHaveBeenCalledWith(mnemonic);

      expect(userService.getPasswordRecoveryIdentifier).toHaveBeenCalledTimes(
        1,
      );
      expect(userService.getPasswordRecoveryIdentifier).toHaveBeenCalledWith();

      expect(Web3.eth.accounts.sign).toHaveBeenCalledTimes(1);
      expect(Web3.eth.accounts.sign).toHaveBeenCalledWith(
        getPasswordRecoveryIdentifierResponse.message,
        privateKeyString,
      );

      expect(userService.recoverWalletsPassword).toHaveBeenCalledTimes(1);
      expect(userService.recoverWalletsPassword).toHaveBeenCalledWith({
        signature,
        main: {
          address: mainAddress,
          keystore: encryptedHdWallet,
        },
        standart: {
          address: standartAddress,
          keystore: encryptedWallets[0],
        },
      });

      expect(commit).toHaveBeenCalledTimes(1);
      expect(commit).toHaveBeenCalledWith(REMOVE_WALLETS);

      expect(dispatch).toHaveBeenCalledTimes(5);
      expect(dispatch).toHaveBeenNthCalledWith(1, 'encryptHdWallet', {
        hdWallet,
        password,
      });
      expect(dispatch).toHaveBeenNthCalledWith(2, 'encryptWallets', {
        wallets: [wallet],
        password,
      });
      expect(dispatch).toHaveBeenNthCalledWith(3, 'setUserHdKey');
      expect(dispatch).toHaveBeenNthCalledWith(4, 'setUserWallets');
      expect(dispatch).toHaveBeenNthCalledWith(
        5,
        'errors/emitError',
        successMessage,
        { root: true },
      );
    });

    it('should handle error when recovering password', async () => {
      expect.assertions(12);

      const wallet = HDKey.getWallet();
      const encryptedHdWallet = {};
      const encryptedWallets = [{}];
      const state = {
        hdKey: { address: mainAddress },
      };

      HDKey.publicExtendedKey.mockReturnValueOnce(mainAddress);
      HDKey.getPrivateKey.mockReturnValueOnce(privateKey.data);
      HDKey.getAddress.mockReturnValueOnce(addressBytes);
      web3.eth.accounts.sign.mockResolvedValueOnce({ signature });
      dispatch.mockResolvedValueOnce(encryptedHdWallet);
      dispatch.mockResolvedValueOnce(encryptedWallets);
      userService.recoverWalletsPassword.mockResolvedValue(errorResponse);

      await actions.recoverWalletsPassword(
        {
          state,
          dispatch,
          commit,
          getters,
        },
        { seedPhrase: mnemonic, password },
      );

      expect(getters.getHdWalletBySeed).toHaveBeenCalledTimes(1);
      expect(getters.getHdWalletBySeed).toHaveBeenCalledWith(mnemonic);

      expect(userService.getPasswordRecoveryIdentifier).toHaveBeenCalledTimes(
        1,
      );
      expect(userService.getPasswordRecoveryIdentifier).toHaveBeenCalledWith();

      expect(Web3.eth.accounts.sign).toHaveBeenCalledTimes(1);
      expect(Web3.eth.accounts.sign).toHaveBeenCalledWith(
        getPasswordRecoveryIdentifierResponse.message,
        privateKeyString,
      );

      expect(userService.recoverWalletsPassword).toHaveBeenCalledTimes(1);
      expect(userService.recoverWalletsPassword).toHaveBeenCalledWith({
        signature,
        main: {
          address: mainAddress,
          keystore: encryptedHdWallet,
        },
        standart: {
          address: standartAddress,
          keystore: encryptedWallets[0],
        },
      });

      expect(commit).toHaveBeenCalledTimes(0);

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenNthCalledWith(1, 'encryptHdWallet', {
        hdWallet,
        password,
      });
      expect(dispatch).toHaveBeenNthCalledWith(2, 'encryptWallets', {
        wallets: [wallet],
        password,
      });
    });
  });

  describe('updateAccountSettings', () => {
    it('should update user settings and save active address locally if last active account not equals to current', async () => {
      expect.assertions(2);

      const state = {
        address: '0x0',
        wallets: {
          '0x0': {
            isPublic: false,
          },
        },
      };
      const rootState = {
        user: {
          email,
        },
      };
      const rootGetters = {
        'user/lastActiveAccount': '0x1',
      };

      await actions.updateAccountSettings({
        state,
        dispatch,
        rootGetters,
        rootState,
      });

      expect(dispatch).toBeCalledWith(
        'user/updateSettings',
        {
          lastActiveAccount: state.address,
        },
        {
          root: true,
        },
      );
      expect(localSettingsService.save).toBeCalledWith(email, {
        activeAccount: state.address,
      });
    });

    it('should not send last account to server if last active account not equals to current', async () => {
      expect.assertions(2);

      const state = {
        address: '0x0',
        wallets: {
          '0x0': {
            isPublic: false,
          },
        },
      };
      const rootState = {
        user: {
          email,
        },
      };
      const rootGetters = {
        'user/lastActiveAccount': '0x0',
      };

      await actions.updateAccountSettings({
        state,
        dispatch,
        rootGetters,
        rootState,
      });

      expect(dispatch).not.toBeCalled();
      expect(localSettingsService.save).toBeCalledWith(email, {
        activeAccount: state.address,
      });
    });
  });

  describe('backupSeed', () => {
    let decryptedHDWallet;
    let decryptedWallet;

    beforeEach(() => {
      decryptedWallet = {
        toV3: jest.fn(() => v3),
      };
      decryptedHDWallet = {
        deriveChild: () => ({
          getWallet: jest.fn(() => decryptedWallet),
        }),
      };
      dispatch.mockResolvedValueOnce(decryptedHDWallet);
    });

    it('should backup seed with user service', async () => {
      expect.assertions(2);

      Wallet.prototype.encryptMessageWithPublicKey = jest
        .fn()
        .mockReturnValue(encryptedMessage);

      await actions.backupSeed({ dispatch }, { password: v3password, seed });

      expect(dispatch).toBeCalledTimes(1);
      expect(userService.backupSeed).toBeCalledWith(encryptedMessage);
    });

    it('should emit error if user service rejects seed backup request', async () => {
      expect.assertions(1);

      const error = new Error('foo');
      Wallet.prototype.encryptMessageWithPublicKey = jest
        .fn()
        .mockRejectedValueOnce(error);

      await actions.backupSeed({ dispatch }, { password: v3password, seed });

      expect(dispatch).toHaveBeenNthCalledWith(2, 'errors/emitError', error, {
        root: true,
      });
    });
  });

  describe('recoverSeed', () => {
    let decryptedHDWallet;
    let decryptedWallet;

    beforeEach(() => {
      decryptedWallet = {
        toV3: jest.fn(() => v3),
      };
      decryptedHDWallet = {
        deriveChild: () => ({
          getWallet: jest.fn(() => decryptedWallet),
        }),
      };
      dispatch.mockResolvedValueOnce(decryptedHDWallet);
    });

    it('should recover seed with given password', async () => {
      expect.assertions(1);

      Wallet.prototype.decryptMessageWithPrivateKey = jest
        .fn()
        .mockReturnValue(seed);
      dispatch.mockResolvedValueOnce(decryptedHDWallet);
      userService.recoverSeed.mockResolvedValueOnce(encryptedMessage);

      const res = await actions.recoverSeed({ dispatch }, v3password);

      expect(res).toBe(seed);
    });

    it('should emit error if user service rejects seed recovery request', async () => {
      expect.assertions(2);

      const error = new Error('foo');
      userService.recoverSeed.mockRejectedValueOnce(error);

      try {
        await actions.recoverSeed({ dispatch }, v3password);
      } catch (err) {
        expect(dispatch).toBeCalledTimes(2);
        expect(dispatch).toHaveBeenNthCalledWith(2, 'errors/emitError', error, {
          root: true,
        });
      }
    });
  });

  describe('addNextWalletFromHd', () => {
    let getters;

    beforeEach(() => {
      getters = {
        accountV3WalletsAddresses: [addressAcc],
      };
      dispatch.mockResolvedValueOnce(nextAddresses);
    });

    it('should request next addresses list and create new wallet with new one', async () => {
      expect.assertions(1);

      await actions.addNextWalletFromHd(
        { dispatch, getters },
        { walletType: WALLET_TYPES.STANDART, password: v3password },
      );

      expect(dispatch).toBeCalledWith('addHdChildWallets', {
        address: nextAddresses[1],
        index: 2,
        type: WALLET_TYPES.STANDART,
        password: v3password,
      });
    });

    it('should request next addresses with offset equals to exist standart wallets count', async () => {
      expect.assertions(1);

      await actions.addNextWalletFromHd(
        { dispatch, getters },
        { walletType: WALLET_TYPES.STANDART, password: v3password },
      );

      expect(dispatch).toHaveBeenNthCalledWith(1, 'getNextWalletsFromHd', {
        offset: 1,
        walletType: WALLET_TYPES.STANDART,
      });
    });
  });
});
