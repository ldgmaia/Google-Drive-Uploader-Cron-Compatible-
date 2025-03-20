import Fastify from 'fastify'
import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'
import dayjs from 'dayjs'

const app = Fastify()

const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
const redirectUri = process.env.GOOGLE_REDIRECT_URI
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
oAuth2Client.setCredentials({ refresh_token: refreshToken })

// ✅ Automatically store new refresh token if updated
oAuth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    console.log('New refresh token received:', tokens.refresh_token)
    fs.writeFileSync('.env', `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`, {
      flag: 'w',
    }) // Replace with secure storage
  }
})

// ✅ Get authorized Google Drive instance (Google handles token refresh)
const getAuthorizedDrive = () =>
  google.drive({ version: 'v3', auth: oAuth2Client })

// ✅ Find the 'backup' folder ID in Google Drive
const getBackupFolderId = async (drive) => {
  const response = await drive.files.list({
    q: `name='${process.env.DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  })

  if (response.data.files.length > 0) {
    return response.data.files[0].id // ✅ Found folder
  } else {
    throw new Error(
      `Backup folder '${process.env.DRIVE_FOLDER_NAME}' not found in Google Drive`
    )
  }
}

// ✅ Upload file from 'uploads' folder to 'backup' folder in Drive
const uploadBackup = async () => {
  try {
    const drive = getAuthorizedDrive() // 🔹 Use authorized drive instance

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
        parents: [backupFolderId], // Upload to 'backup' folder
      },
      media: {
        mimeType: 'application/gzip',
        body: fs.createReadStream(filePath),
      },
    })

    console.log(`✅ File uploaded: ${newFileName} (ID: ${response.data.id})`)
  } catch (err) {
    console.error('❌ Error uploading file:', err.message)
  }
}

// ✅ Run automatically (for Cron job)
uploadBackup()

export default app
