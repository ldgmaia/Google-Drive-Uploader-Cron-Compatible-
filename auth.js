// auth.js
import { google } from 'googleapis'
import readline from 'readline'
import dotenv from 'dotenv'

dotenv.config()

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

const SCOPES = ['https://www.googleapis.com/auth/drive']

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
})

console.log('👉 Visit this URL to authorize:\n\n', authUrl)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('\n🔑 Paste the code from Google here: ', (code) => {
  rl.close()
  oAuth2Client.getToken(code, (err, token) => {
    if (err) return console.error('❌ Error retrieving access token', err)
    console.log('\n✅ Tokens received:\n')
    console.log(JSON.stringify(token, null, 2))
    console.log(
      '\n💾 Copy the `refresh_token` to your `.env` or `tokens.json` file'
    )
  })
})

// update the tokens.json and .env files with the new refresh token
