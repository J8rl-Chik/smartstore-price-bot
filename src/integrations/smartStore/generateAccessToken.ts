import bcrypt from 'bcryptjs';
import fetch from 'node-fetch';

import checkSmartStoreApiSucceeded, {
  type SmartStoreApiResult,
} from './checkSmartStoreApiSucceeded.js';
import { ERROR_MESSAGE } from '../../domain/error/errorMessage.js';
import type { CommerceApiCredentials } from '../../domain/settings/_type.js';

interface AccessTokenResult extends SmartStoreApiResult {
  access_token: string;
}

async function generateAccessToken({
  clientId,
  clientSecret,
}: CommerceApiCredentials): Promise<string> {
  try {
    const timestamp = Date.now();
    const password = `${clientId}_${timestamp}`;
    const hashedPassword = bcrypt.hashSync(password, clientSecret);
    const clientSecretSign = Buffer.from(hashedPassword, 'utf-8').toString('base64');
    const tokenURL = 'https://api.commerce.naver.com/external/v1/oauth2/token';

    const query = new URLSearchParams({
      client_id: clientId,
      timestamp: timestamp.toString(),
      grant_type: 'client_credentials',
      client_secret_sign: clientSecretSign,
      type: 'SELF',
    });

    const response = await fetch(`${tokenURL}?${query}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const result: AccessTokenResult = await response.json();

    checkSmartStoreApiSucceeded(result);

    return result.access_token;
  } catch (error) {
    throw new Error(ERROR_MESSAGE.ACCESS_TOKEN_FAILED, { cause: error });
  }
}

export default generateAccessToken;
