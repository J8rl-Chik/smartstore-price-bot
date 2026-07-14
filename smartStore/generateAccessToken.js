import 'dotenv/config';
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';

import isManualTestRun from '../util/isManualTestRun.js';

if (isManualTestRun(import.meta.url)) {
  generateAccessToken().then(() => {
    console.log('generateAccessToken 함수 테스트');
  });
}

export default async function generateAccessToken() {
  const { CLIENT_ID, CLIENT_SECRET } = process.env;
  const timestamp = Date.now();
  const password = `${CLIENT_ID}_${timestamp}`;
  const hashedPassword = bcrypt.hashSync(password, CLIENT_SECRET);
  const clientSecretSign = Buffer.from(hashedPassword, 'utf-8').toString('base64');

  const TOKEN_URL = 'https://api.commerce.naver.com/external/v1/oauth2/token';
  const query = new URLSearchParams({
    client_id: CLIENT_ID,
    timestamp,
    grant_type: 'client_credentials',
    client_secret_sign: clientSecretSign,
    type: 'SELF',
  });

  const response = await fetch(`${TOKEN_URL}?${query}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const { access_token } = await response.json();

  return access_token;
}
