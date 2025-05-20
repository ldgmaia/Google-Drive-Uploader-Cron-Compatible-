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

// 🔄 Load only refresh_token
const loadRefreshToken = () => {
  if (fs.existsSync(TOKENS_PATH)) {
    const raw = fs.readFileSync(TOKENS_PATH, 'utf-8')
    const tokens = JSON.parse(raw)
    if (!tokens.refresh_token) {
      throw new Error('Missing refresh token in tokens.json')
    }
    return { refresh_token: tokens.refresh_token }
  }
  const envRefresh = process.env.GOOGLE_REFRESH_TOKEN
  if (!envRefresh)
    throw new Error('Missing refresh token in .env and tokens.json')
  return { refresh_token: envRefresh }
}

// 🔐 Setup OAuth2 client
const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
oAuth2Client.setCredentials(loadRefreshToken())

// 🔍 Log all token requests and API calls
google.options({ debug: true })
oAuth2Client.request = new Proxy(oAuth2Client.request, {
  apply(target, thisArg, args) {
    console.log('📡 Making request to Google API:', args[0]?.url || args[0])
    return Reflect.apply(target, thisArg, args)
  },
})

// ✅ Get authorized Drive instance
const getAuthorizedDrive = () =>
  google.drive({ version: 'v3', auth: oAuth2Client })

// 📁 Find backup folder
const getBackupFolderId = async (drive) => {
  const folderName = process.env.DRIVE_FOLDER_NAME?.trim()
  const response = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  })

  if (response.data.files.length > 0) {
    return response.data.files[0].id
  } else {
    throw new Error(`Backup folder '${folderName}' not found in Google Drive`)
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
    if (err.message.includes('invalid_grant')) {
      console.error(
        '❌ Refresh token is invalid or expired. Please reauthorize.'
      )
    } else {
      console.error('❌ Error uploading file:', err.message)
    }
  }
}

// ⏰ Run backup
uploadBackup()

export default app
