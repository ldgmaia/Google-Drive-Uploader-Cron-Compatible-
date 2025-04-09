import Fastify from 'fastify'
import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'
import dayjs from 'dayjs'

const app = Fastify()

const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
const redirectUri = process.env.GOOGLE_REDIRECT_URI

const TOKENS_PATH = path.join(process.cwd(), 'tokens.json')

// 🔄 Load saved refresh token from tokens.json or fallback to .env
const loadTokens = () => {
  if (fs.existsSync(TOKENS_PATH)) {
    const raw = fs.readFileSync(TOKENS_PATH, 'utf-8')
    const tokens = JSON.parse(raw)
    return tokens
  } else {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
    if (!refreshToken) {
      throw new Error('No refresh token found in tokens.json or .env')
    }
    return { refresh_token: refreshToken }
  }
}

// 🔐 Setup OAuth2 client
const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
oAuth2Client.setCredentials(loadTokens())

// 💾 Automatically save new tokens to tokens.json
oAuth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token || tokens.access_token) {
    const currentTokens = loadTokens()
    const updatedTokens = { ...currentTokens, ...tokens }
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(updatedTokens, null, 2))
    console.log('✅ Saved updated tokens to tokens.json')
  }
})

// 🔑 Get authorized Drive instance
const getAuthorizedDrive = () =>
  google.drive({ version: 'v3', auth: oAuth2Client })

// 📁 Find backup folder
const getBackupFolderId = async (drive) => {
  const response = await drive.files.list({
    q: `name='${process.env.DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  })

  if (response.data.files.length > 0) {
    return response.data.files[0].id
  } else {
    throw new Error(
      `Backup folder '${process.env.DRIVE_FOLDER_NAME}' not found in Google Drive`
    )
  }
}

// 📤 Upload backup file
const uploadBackup = async () => {
  try {
    const drive = getAuthorizedDrive()

    const timestamp = dayjs().format('YYYYMMDD-HHmmss')
    const newFileName = `rbms_backup_${timestamp}.gz`
    const filePath = path.join(process.cwd(), 'uploads', 'dump.gz')

    if (!fs.existsSync(filePath)) {
      console.error('❌ File does not exist:', filePath)
      return
    }

    const backupFolderId = await getBackupFolderId(drive)

    const response = await drive.files.create({
      requestBody: {
        name: newFileName,
        mimeType: 'application/gzip',
        parents: [backupFolderId],
      },
      media: {
        mimeType: 'application/gzip',
        body: fs.createReadStream(filePath),
      },
    })

    console.log(`✅ File uploaded: ${newFileName} (ID: ${response.data.id})`)
  } catch (err) {
    if (err.message === 'invalid_grant') {
      console.error(
        '❌ Refresh token is invalid or expired. Please reauthorize.'
      )
    } else {
      console.error('❌ Error uploading file:', err.message)
    }
  }
}

// ⏰ Run backup automatically (for cron)
uploadBackup()

export default app
