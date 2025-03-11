import Fastify from 'fastify'
import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'
import dayjs from 'dayjs'

const app = Fastify()

const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
const redirectUri = process.env.GOOGLE_REDIRECT_URI
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN // 🔹 Store the refresh token

const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
oAuth2Client.setCredentials({ refresh_token: refreshToken }) // 🔹 Set refresh token

// ✅ **Automatically refresh access token before each request**
const getAuthorizedDrive = async () => {
  try {
    const { credentials } = await oAuth2Client.refreshAccessToken() // 🔹 Refresh access token
    oAuth2Client.setCredentials(credentials)
    return google.drive({ version: 'v3', auth: oAuth2Client })
  } catch (error) {
    console.error('Error refreshing access token:', error)
    throw new Error('Failed to refresh Google Drive access token')
  }
}

// ✅ **Find the 'backup' folder ID in Google Drive**
const getBackupFolderId = async (drive) => {
  const response = await drive.files.list({
    q: "name='backup' and mimeType='application/vnd.google-apps.folder'",
    fields: 'files(id)',
  })

  if (response.data.files.length > 0) {
    return response.data.files[0].id // Return folder ID
  } else {
    throw new Error('Backup folder not found in Google Drive')
  }
}

// ✅ **Upload file from 'uploads' folder to 'backup' folder in Drive**
const uploadBackup = async () => {
  try {
    const drive = await getAuthorizedDrive() // 🔹 Get authorized drive instance

    const timestamp = dayjs().format('YYYYMMDD-HHmmss') // Generate timestamp
    const newFileName = `rbms_backup_${timestamp}.gz` // Rename file

    const filePath = path.join(process.cwd(), 'uploads', 'dump.gz') // Path to file

    if (!fs.existsSync(filePath)) {
      console.error('File does not exist')
      return
    }

    const backupFolderId = await getBackupFolderId(drive) // Get folder ID

    const response = await drive.files.create({
      requestBody: {
        name: newFileName,
        mimeType: 'application/gzip',
        parents: [backupFolderId], // Upload to 'backup' folder
      },
      media: {
        mimeType: 'application/gzip',
        body: fs.createReadStream(filePath), // Read file
      },
    })

    console.log(`✅ File uploaded: ${newFileName} (ID: ${response.data.id})`)
  } catch (err) {
    console.error('Error uploading file:', err)
  }
}

// ✅ **Run automatically (for Cron job)**
uploadBackup()

export default app
