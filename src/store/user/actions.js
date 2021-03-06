import { mapKeys, mapValues } from 'lodash';
import ConnectError from '@endpass/class/ConnectError';
import { userService, identityModeService, otpService } from '@/services';
import { NotificationError, Token, connect } from '@/class';
import { IDENTITY_MODE } from '@/constants';
import {
  SET_AUTHORIZATION_STATUS,
  SET_IDENTITY_TYPE,
  SET_EMAIL,
  SET_SETTINGS,
  SET_OTP_SETTINGS,
} from './mutations-types';
import i18n from '@/locales/i18n';

const setAuthorizationStatus = (
  { commit, getters },
  { authorizationStatus },
) => {
  commit(SET_AUTHORIZATION_STATUS, authorizationStatus);

  if (getters.isLoggedOut) {
    /* eslint-disable-next-line */
    const notificationError = new NotificationError({
      title: 'Auth error',
      text:
        'You are not an authorized user. In order to continue using the wallet, please log in.',
      type: 'is-danger',
    });

    // dispatch('errors/emitError', notificationError, { root: true });
  }
};

const login = async ({ commit, dispatch }) => {
  try {
    const res = await connect.auth(window.location.origin);
    const { type = IDENTITY_MODE.DEFAULT, serverUrl } = res || {};

    identityModeService.setIdentityMode(type, serverUrl);
    commit(SET_IDENTITY_TYPE, type);
    commit(SET_AUTHORIZATION_STATUS, true);

    await dispatch('init', null, { root: true });
  } catch (err) {
    if (err.code !== ConnectError.ERRORS.AUTH_CANCELED_BY_USER) {
      await dispatch('errors/emitError', err, { root: true });
    }
  }
};

const logout = async ({ commit, dispatch, getters }) => {
  commit(SET_AUTHORIZATION_STATUS, false);
  commit(SET_EMAIL, null);

  try {
    if (getters.isDefaultIdentity) {
      await connect.logout();
    }

    if (getters.isLocalIdentity) {
      await identityModeService.deleteIdentityData();
    }

    try {
      identityModeService.setIdentityMode(IDENTITY_MODE.DEFAULT);
    } catch (e) {} // eslint-disable-line no-empty

    window.location.reload();
  } catch (e) {
    dispatch('errors/emitError', e, { root: true });
  }
};

const validateCustomServer = (ctx, { serverUrl }) =>
  identityModeService.validateIdentityServer(serverUrl);

const getOtpSettings = async ({ commit, dispatch }) => {
  try {
    const otpSettings = await otpService.getOtpSettings();

    commit(SET_OTP_SETTINGS, otpSettings);
  } catch (e) {
    dispatch('errors/emitError', e, { root: true });
  }
};

const setOtpSettings = async (
  { commit },
  { secret, code, verificationCode },
) => {
  await otpService.setOtpSettings({ secret, code, verificationCode });
  commit(SET_OTP_SETTINGS, { status: 'enabled' });
};

const deleteOtpSettings = async ({ commit, dispatch }, { code }) => {
  await otpService.deleteOtpSettings({ code });
  commit(SET_OTP_SETTINGS, {});
  await dispatch('getOtpSettings');
};

const updateSettings = async ({ commit, dispatch }, settings) => {
  try {
    commit(SET_SETTINGS, settings);
    await userService.setSettings(settings);
  } catch (e) {
    dispatch('errors/emitError', e, { root: true });
  }
};

const setUserSettings = async ({ commit, dispatch }) => {
  try {
    const {
      fiatCurrency,
      email,
      tokens,
      lastActiveAccount,
    } = await userService.getSettings();

    if (email) {
      commit(SET_EMAIL, email);
      await userService.setSettings({ email });
    }

    if (fiatCurrency) {
      commit(SET_SETTINGS, { fiatCurrency, lastActiveAccount });
    }

    if (tokens) {
      const normalizedTokens = mapValues(tokens, netTokens =>
        netTokens.map(token => Token.getConsistent(token)),
      );
      const mappedTokens = mapValues(normalizedTokens, netTokens =>
        mapKeys(netTokens, 'symbol'),
      );

      dispatch('tokens/setUserTokens', mappedTokens, { root: true });
    }
  } catch (e) {
    await dispatch('errors/emitError', e, { root: true });
  }
};

const initIdentityMode = async ({ commit, dispatch }, mode) => {
  try {
    const { type, serverUrl } = mode || identityModeService.getIdentityMode();
    identityModeService.setIdentityMode(type, serverUrl);

    if (type !== IDENTITY_MODE.DEFAULT) {
      commit(SET_IDENTITY_TYPE, type);
      commit(SET_AUTHORIZATION_STATUS, true);
    }
  } catch (e) {
    await dispatch('errors/emitError', e, { root: true });
  }
};

const updateEmail = async (
  { rootGetters, dispatch, commit },
  { email, password },
) => {
  const wallet = rootGetters['accounts/wallet'];
  const { signature } = await wallet.sign(email, password);
  try {
    await userService.updateEmail({ email, signature });
    commit(SET_EMAIL, email);
    throw new NotificationError({
      title: 'The email is successfully updated',
      text: `Your new email is ${email}.`,
      type: 'is-success',
    });
  } catch (error) {
    await dispatch('errors/emitError', error, { root: true });
  }
};

const sendCode = async (ctx, email) => {
  try {
    await otpService.sendCode(email);
  } catch (err) {
    throw new NotificationError({
      title: i18n.t('errors.verificationCode.title'),
      text: i18n.t('errors.verificationCode.text'),
      type: 'is-danger',
    });
  }
};

const init = async ({ dispatch }) => {
  try {
    await dispatch('setUserSettings');
  } catch (e) {
    await dispatch('errors/emitError', e, { root: true });
  }
};

export default {
  setAuthorizationStatus,
  updateSettings,
  login,
  logout,
  getOtpSettings,
  setOtpSettings,
  setUserSettings,
  deleteOtpSettings,
  validateCustomServer,
  updateEmail,
  initIdentityMode,
  sendCode,
  init,
};
