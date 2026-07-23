import 'dotenv/config';
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';

import checkSmartStoreApiSucceeded, {
  type SmartStoreApiResult,
} from './checkSmartStoreApiSucceeded.js';

interface AccessTokenResult extends SmartStoreApiResult {
  access_token: string;
}

async function generateAccessToken(): Promise<string> {
  try {
    const { CLIENT_ID, CLIENT_SECRET } = process.env;
    const timestamp = Date.now();
    const password = `${CLIENT_ID}_${timestamp}`;
    const hashedPassword = bcrypt.hashSync(password, CLIENT_SECRET as string);
    const clientSecretSign = Buffer.from(hashedPassword, 'utf-8').toString('base64');
    const tokenURL = 'https://api.commerce.naver.com/external/v1/oauth2/token';

    const query = new URLSearchParams({
      client_id: CLIENT_ID as string,
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
    throw new Error('네이버 접근 토큰을 발급받지 못했습니다.', { cause: error });
  }
}

export default generateAccessToken;
