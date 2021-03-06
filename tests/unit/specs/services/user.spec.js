import MockAdapter from 'axios-mock-adapter';
import { hdv3, encryptedMessage } from 'fixtures/accounts';
import { successResponse } from 'fixtures/identity';
import { NotificationError, Wallet } from '@/class';
import { httpIdentity } from '@/class/singleton';

const WALLET_TYPES = Wallet.getTypes();

const userService = require.requireActual('@/services/user').default;

describe('User service', () => {
  let axiosMock;

  beforeEach(() => {
    axiosMock = new MockAdapter(httpIdentity);
  });

  describe('getSettings', () => {
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/settings`;
    const successResp = {
      fiatCurrency: 'USD',
    };

    it('should make correct request', async () => {
      expect.assertions(2);

      axiosMock.onGet(url).reply(config => {
        expect(config.method).toBe('get');
        expect(config.url).toBe(url);

        return [200, successResp];
      });

      await userService.getSettings();
    });

    it('should handle successfull GET /settings request', async () => {
      expect.assertions(1);

      axiosMock.onGet(url).reply(200, successResp);

      const settings = await userService.getSettings();

      expect(settings).toEqual(successResp);
    });
  });

  describe('setSettings', () => {
    const settings = {
      fiatCurrency: 'USD',
    };
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/settings`;

    it('should make correct request', async () => {
      expect.assertions(3);

      axiosMock.onPost(url).reply(config => {
        expect(config.method).toBe('post');
        expect(config.url).toBe(url);
        expect(config.data).toBe(JSON.stringify(settings));

        return [200, successResponse];
      });

      await userService.setSettings(settings);
    });

    it('should handle successful POST /user request', async () => {
      expect.assertions(1);

      axiosMock.onPost(url).reply(200, successResponse);

      const resp = await userService.setSettings(settings);

      expect(resp).toEqual(successResponse);
    });
  });

  describe('Tokens', () => {
    const net = 1;
    const address = 'address';
    const token = { address };
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/tokens/${net}/${address}`;

    describe('addToken', () => {
      it('should make correct request', async () => {
        expect.assertions(2);

        axiosMock.onPost(url).reply(config => {
          expect(config.url).toBe(url);
          expect(config.data).toBe(JSON.stringify(token));

          return [200, successResponse];
        });

        await userService.addToken(net, token);
      });

      it('should handle successful POST /tokens request', async () => {
        expect.assertions(1);

        axiosMock.onPost(url).reply(200, successResponse);

        const resp = await userService.addToken(net, token);

        expect(resp).toEqual(successResponse);
      });

      it('should handle rejected POST /tokens request', async () => {
        expect.assertions(1);

        axiosMock.onPost(url).reply(401);

        await expect(userService.addToken(net, token)).rejects.toThrow(
          expect.any(NotificationError),
        );
      });
    });

    describe('removeToken', () => {
      it('should make correct request', async () => {
        expect.assertions(1);

        axiosMock.onDelete(url).reply(config => {
          expect(config.url).toBe(url);

          return [200, successResponse];
        });

        await userService.removeToken(net, address);
      });

      it('should handle successful DELETE /tokens request', async () => {
        expect.assertions(1);

        axiosMock.onDelete(url).reply(200, successResponse);

        const resp = await userService.removeToken(net, address);

        expect(resp).toEqual(successResponse);
      });

      it('should handle rejected DELETE /tokens request', async () => {
        expect.assertions(1);

        axiosMock.onDelete(url).reply(401);

        await expect(userService.removeToken(net, address)).rejects.toThrow(
          expect.any(NotificationError),
        );
      });
    });
  });

  describe('Networks', () => {
    const netUrl = 'address';
    const network = { url: netUrl };
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/networks/${netUrl}`;

    describe('addNetwork', () => {
      it('should make correct request', async () => {
        expect.assertions(2);

        axiosMock.onPost(url).reply(config => {
          expect(config.url).toBe(url);
          expect(config.data).toBe(JSON.stringify(network));

          return [200, successResponse];
        });

        await userService.addNetwork(network);
      });

      it('should handle successful POST /networks request', async () => {
        expect.assertions(1);

        axiosMock.onPost(url).reply(200, successResponse);

        const resp = await userService.addNetwork(network);

        expect(resp).toEqual(successResponse);
      });

      it('should handle rejected POST /networks request', async () => {
        expect.assertions(1);

        axiosMock.onPost(url).reply(401);

        await expect(userService.addNetwork(network)).rejects.toThrow(
          expect.any(NotificationError),
        );
      });
    });

    describe('updateNetwork', () => {
      const oldUrl = 'old';
      const urlForUpdate = `${ENV.VUE_APP_IDENTITY_API_URL}/networks/${oldUrl}`;

      it('should make correct request', async () => {
        expect.assertions(2);

        axiosMock.onPost(urlForUpdate).reply(config => {
          expect(config.url).toBe(urlForUpdate);
          expect(config.data).toBe(JSON.stringify(network));

          return [200, successResponse];
        });

        await userService.updateNetwork(oldUrl, network);
      });

      it('should handle successful POST /networks request', async () => {
        expect.assertions(1);

        axiosMock.onPost(urlForUpdate).reply(200, successResponse);

        const resp = await userService.updateNetwork(oldUrl, network);

        expect(resp).toEqual(successResponse);
      });

      it('should handle rejected POST /networks request', async () => {
        expect.assertions(1);

        axiosMock.onPost(urlForUpdate).reply(401);

        await expect(
          userService.updateNetwork(oldUrl, network),
        ).rejects.toThrow(expect.any(NotificationError));
      });
    });

    describe('removeNetwork', () => {
      it('should make correct request', async () => {
        expect.assertions(1);

        axiosMock.onDelete(url).reply(config => {
          expect(config.url).toBe(url);

          return [200, successResponse];
        });

        await userService.removeNetwork(network.url);
      });

      it('should handle successful DELETE /tokens request', async () => {
        expect.assertions(1);

        axiosMock.onDelete(url).reply(200, successResponse);

        const resp = await userService.removeNetwork(network.url);

        expect(resp).toEqual(successResponse);
      });

      it('should handle rejected DELETE /tokens request', async () => {
        expect.assertions(1);

        axiosMock.onDelete(url).reply(401);

        await expect(userService.removeNetwork(network.url)).rejects.toThrow(
          expect.any(NotificationError),
        );
      });
    });
  });

  describe('getAccounts', () => {
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/accounts`;
    const successResp = ['0x123', 'xpub1234'];

    it('should make correct request', async () => {
      expect.assertions(2);

      axiosMock.onGet(url).reply(config => {
        expect(config.method).toBe('get');
        expect(config.url).toBe(url);

        return [200, successResp];
      });

      await userService.getAccounts();
    });

    it('should handle successful GET /accounts request', async () => {
      expect.assertions(2);

      axiosMock.onGet(url).reply(200, successResp);

      const accounts = await userService.getAccounts();

      expect(accounts.length).toBe(2);
      expect(accounts[0]).toEqual(successResp[0]);
    });
  });

  describe('getAccount', () => {
    const address = '0x456';
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/account/${address}`;
    const shortAcc = address.replace(/^(.{5}).+/, '$1…');
    const successResp = {};
    const expectedError = new NotificationError({
      title: 'Account request error',
      text: `Failed to get account ${shortAcc}. Please, reload page`,
      type: 'is-danger',
    });

    it('should make correct request', async () => {
      expect.assertions(2);

      axiosMock.onGet(url).reply(config => {
        expect(config.method).toBe('get');
        expect(config.url).toBe(url);

        return [200, successResp];
      });

      await userService.getAccount(address);
    });

    it('should handle successfull GET /account request', async () => {
      expect.assertions(1);

      axiosMock.onGet(url).reply(200, successResp);

      const account = await userService.getAccount(address);
      // Address should be automatically appended by getAccount
      expect(account).toEqual({ address, info: {} });
    });

    it('should handle rejected GET /account request', async () => {
      expect.assertions(1);

      axiosMock.onGet(url).reply(404);

      try {
        await userService.getAccount(address);
      } catch (receivedError) {
        expect(receivedError).toEqual(expectedError);
      }
    });
  });

  describe('setAccount', () => {
    const address = '0x123';
    // Account data can be anything
    const account = { version: 3, crypto: {} };
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/account/${address}`;

    it('should make correct request', async () => {
      expect.assertions(5);

      const spy = jest
        .spyOn(userService, 'setAccountInfo')
        .mockImplementationOnce(() => Promise.resolve());

      axiosMock.onPost(url).reply(config => {
        expect(config.method).toBe('post');
        expect(config.url).toBe(url);
        expect(config.data).toBe(JSON.stringify(account));

        return [200, successResponse];
      });

      await userService.setAccount(address, account);

      const defaultAccountInfo = {
        address,
        type: WALLET_TYPES.STANDARD,
        hidden: false,
      };

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(address, defaultAccountInfo);

      spy.mockRestore();
    });
  });

  describe('setAccountInfo', () => {
    const address = '0x123';
    // Account data can be anything
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/account/${address}/info`;
    const info = { one: 'two' };

    it('should make correct request', async () => {
      expect.assertions(2);

      axiosMock.onPost(url).reply(config => {
        expect(config.method).toBe('post');
        expect(config.data).toBe(JSON.stringify(info));

        return [200, successResponse];
      });

      await userService.setAccountInfo(address, info);
    });
  });

  describe('updateAccounts', () => {
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/accounts`;
    const accounts = {
      'address 1': {},
      'address 2': {},
    };
    const expectedError = new NotificationError({
      title: 'Error updating accounts',
      text: 'An error occurred updating accounts. Please try again later',
      type: 'is-danger',
    });

    it('should make correct request', async () => {
      expect.assertions(3);

      axiosMock.onAny(url).reply(config => {
        expect(config.method).toBe('post');
        expect(config.url).toBe(url);
        expect(config.data).toBe(JSON.stringify(accounts));

        return [200];
      });

      await userService.updateAccounts(accounts);
    });

    it('should handle successful POST /accounts request', async () => {
      expect.assertions(1);

      axiosMock.onPost(url).reply(200, successResponse);

      const response = await userService.updateAccounts(accounts);

      expect(response).toEqual(successResponse);
    });

    it('should handle rejected GET /accounts request', async () => {
      expect.assertions(1);

      axiosMock.onPost(url).reply(404);

      try {
        await userService.updateAccounts(accounts);
      } catch (receivedError) {
        expect(receivedError).toEqual(expectedError);
      }
    });
  });

  describe('HD Accounts', () => {
    const addrs = ['0x123', 'xpubabcde', '0x456'];

    it('should return keystores for regular accounts only', async () => {
      expect.assertions(3);

      axiosMock
        .onGet(`${ENV.VUE_APP_IDENTITY_API_URL}/accounts`)
        .reply(200, addrs);
      axiosMock
        .onGet(new RegExp(`${ENV.VUE_APP_IDENTITY_API_URL}/account/.+`))
        .reply(200, {});

      const accounts = await userService.getV3Accounts();
      const info = {};

      expect(accounts.length).toBe(2);
      expect(accounts[0]).toEqual({ address: '0x123', info });
      expect(accounts[1]).toEqual({ address: '0x456', info });
    });

    it('should return the HD key if it exists', async () => {
      expect.assertions(2);

      axiosMock
        .onGet(`${ENV.VUE_APP_IDENTITY_API_URL}/accounts`)
        .reply(200, addrs);
      axiosMock
        .onGet(new RegExp(`${ENV.VUE_APP_IDENTITY_API_URL}/account/.+`))
        .reply(200, hdv3);

      const account = await userService.getHDKey();

      expect(account).toBeTruthy();
      expect(account.address).toBe('xpubabcde');
    });

    it('should return the main HD key if it exists', async () => {
      expect.assertions(2);

      const mainAddress = 'xpub12345';
      const addresses = [...addrs, mainAddress];

      axiosMock
        .onGet(`${ENV.VUE_APP_IDENTITY_API_URL}/accounts`)
        .reply(200, addresses);
      axiosMock
        .onGet(`${ENV.VUE_APP_IDENTITY_API_URL}/account/${mainAddress}/info`)
        .reply(200, { type: WALLET_TYPES.HD_MAIN });
      axiosMock
        .onGet(new RegExp(`${ENV.VUE_APP_IDENTITY_API_URL}/account/.+`))
        .reply(200, {});

      const account = await userService.getHDKey();

      expect(account).toBeTruthy();
      expect(account.address).toBe(mainAddress);
    });
  });

  describe('getPasswordRecoveryIdentifier', () => {
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/recovery-password`;
    const passwordRecoveryIdentifier = 'password recovery identifier';
    const successIdentifierResponse = {
      ...successResponse,
      message: passwordRecoveryIdentifier,
    };
    const expectedError = new NotificationError({
      title: 'Error recovering wallet password',
      text:
        'An error occurred while recovering wallet password. Please try again.',
      type: 'is-danger',
    });
    const errorMessage = 'server error';

    it('should make correct request', async () => {
      expect.assertions(1);

      axiosMock.onGet(url).reply(config => {
        expect(config.url).toBe(url);

        return [200, successIdentifierResponse];
      });

      await userService.getPasswordRecoveryIdentifier();
    });

    it('should handle successful GET /recovery-password request', async () => {
      expect.assertions(1);

      axiosMock.onGet(url).reply(200, successIdentifierResponse);

      const resp = await userService.getPasswordRecoveryIdentifier();

      expect(resp).toEqual(successIdentifierResponse.message);
    });

    it('should handle failed GET /recovery-password request', async () => {
      expect.assertions(1);

      const error = new NotificationError({
        ...expectedError,
        message: `GET ${url}: ${errorMessage}`,
      });

      axiosMock
        .onGet(url)
        .reply(200, { success: false, message: errorMessage });

      try {
        await userService.getPasswordRecoveryIdentifier();
      } catch (receivedError) {
        expect(receivedError).toEqual(error);
      }
    });

    it('should handle rejected GET /recovery-password request', async () => {
      expect.assertions(1);

      axiosMock.onGet(url).reply(500, {});

      try {
        await userService.getPasswordRecoveryIdentifier();
      } catch (receivedError) {
        expect(receivedError.text).toEqual(expectedError.text);
      }
    });
  });

  describe('recoverWalletsPassword', () => {
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/recovery-password`;
    const signature = 'signature';
    const main = {};
    const standart = {};
    const expectedError = new NotificationError({
      title: 'Error recovering wallet password',
      text:
        'An error occurred while recovering wallet password. Please try again.',
      type: 'is-danger',
    });
    const errorMessage = 'server error';

    it('should make correct request', async () => {
      expect.assertions(2);

      axiosMock.onPost(url).reply(config => {
        expect(config.url).toBe(url);
        expect(config.data).toBe(JSON.stringify({ signature, main, standart }));

        return [200, successResponse];
      });

      await userService.recoverWalletsPassword({ signature, main, standart });
    });

    it('should handle successful POST /recovery-password request', async () => {
      expect.assertions(1);

      axiosMock.onPost(url).reply(200, successResponse);

      const resp = await userService.recoverWalletsPassword({
        signature,
        main,
        standart,
      });

      expect(resp).toEqual(successResponse);
    });

    it('should handle failed POST /recovery-password request', async () => {
      expect.assertions(1);

      const error = new NotificationError({
        ...expectedError,
        message: `POST ${url}: ${errorMessage}`,
      });

      axiosMock
        .onPost(url)
        .reply(200, { success: false, message: errorMessage });

      try {
        await userService.recoverWalletsPassword({ signature, main, standart });
      } catch (receivedError) {
        expect(receivedError).toEqual(error);
      }
    });

    it('should handle rejected GET /recovery-password request', async () => {
      expect.assertions(1);

      axiosMock.onPost(url).reply(500, {});

      try {
        await userService.recoverWalletsPassword({ signature, main, standart });
      } catch (receivedError) {
        expect(receivedError.text).toEqual(expectedError.text);
      }
    });
  });

  describe('backupSeed', () => {
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/user/seed`;

    it('should request backuped seed', async () => {
      expect.assertions(2);

      axiosMock.onPost(url).reply(config => {
        expect(config.url).toBe(url);
        expect(config.data).toBe(
          JSON.stringify({
            seed: encryptedMessage,
          }),
        );

        return [200];
      });
      await userService.backupSeed(encryptedMessage);
    });

    it('should throw notificaton error if request failed', async () => {
      expect.assertions(1);

      axiosMock.onPost(url).reply(() => [500]);

      try {
        await userService.backupSeed(encryptedMessage);
      } catch (err) {
        expect(err).toBeInstanceOf(NotificationError);
      }
    });
  });

  describe('recoverSeed', () => {
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/user/seed`;

    it('should request user backuped seed', async () => {
      expect.assertions(2);

      const response = {
        seed: encryptedMessage,
      };

      axiosMock.onGet(url).reply(config => {
        expect(config.url).toBe(url);
        return [200, response];
      });

      const res = await userService.recoverSeed();

      expect(res).toEqual(response.seed);
    });

    it('should throw notificaton error if seed is not backuped', async () => {
      expect.assertions(1);

      axiosMock.onGet(url).reply(() => [404]);

      try {
        await userService.recoverSeed();
      } catch (err) {
        expect(err).toBeInstanceOf(NotificationError);
      }
    });

    it('should throw notificaton on unexpected error', async () => {
      expect.assertions(1);

      axiosMock.onGet(url).reply(() => [500]);

      try {
        await userService.recoverSeed();
      } catch (err) {
        expect(err).toBeInstanceOf(NotificationError);
      }
    });
  });
  describe('updateEmail', () => {
    const url = `${ENV.VUE_APP_IDENTITY_API_URL}/user/email`;
    const successfulResponse = {
      success: true,
    };
    const payload = {
      signature: 'kek',
      email: 'chpok',
    };
    it('should make correct request', async () => {
      expect.assertions(3);

      axiosMock.onAny(url).reply(config => {
        expect(config.method).toBe('post');
        expect(config.url).toBe(url);
        expect(config.data).toBe(JSON.stringify(payload));

        return [200, successResponse];
      });

      await userService.updateEmail(payload);
    });

    it('should handle successful POST /user/email request', async () => {
      expect.assertions(1);

      axiosMock.onPost(url).reply(200, successfulResponse);

      const response = await userService.updateEmail();

      expect(response).toEqual(successfulResponse);
    });

    it('should handle rejected POST /user/email request', async () => {
      expect.assertions(1);

      axiosMock.onPost(url).reply(404);

      try {
        await userService.updateEmail();
      } catch (receivedError) {
        expect(receivedError).toBeInstanceOf(NotificationError);
      }
    });
  });
});
