// auth.js
import { google } from 'googleapis'
import readline from 'readline'
import fs from 'fs'

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

const SCOPES = ['https://www.googleapis.com/auth/drive']
const TOKEN_PATH = './tokens.json'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
})

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
})

console.log('🔑 Authorize this app by visiting this URL:\n', authUrl)

rl.question('\nPaste the code from that page here: ', async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code)
    console.log('✅ Tokens:', tokens)
    fs.writeFileSync(
      TOKEN_PATH,
      JSON.stringify({ refresh_token: tokens.refresh_token }, null, 2)
    )
    console.log(`Saved refresh_token to ${TOKEN_PATH}`)
    rl.close()
  } catch (err) {
    console.error('❌ Error retrieving tokens:', err.message)
    rl.close()
  }
})
