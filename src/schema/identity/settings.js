import { userNetwork } from './network';
import { userToken } from './token';

// eslint-disable-next-line import/prefer-default-export
export const userSettings = {
  type: 'object',
  required: ['email', 'fiatCurrency', 'otpEnabled'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    fiatCurrency: {
      type: 'string',
      minLength: 1,
      default: 'USD',
    },
    otpEnabled: {
      type: 'boolean',
    },
    net: {
      type: 'integer',
    },
    networks: {
      type: 'array',
      items: { ...userNetwork },
    },
    tokens: {
      type: 'object',
      propertyNames: { type: 'string' },
      additionalProperties: {
        type: 'array',
        items: { ...userToken },
      },
    },
  },
};
