# Google Drive Uploader (Cron Compatible)

This project provides a simple Node.js script to upload files to Google Drive using the Google Drive API. It's designed to be easily integrated with `crontab` for automated uploads.

## Prerequisites

* Node.js (v14 or higher)
* npm or yarn
* A Google Cloud Platform project with the Google Drive API enabled.
* OAuth 2.0 Client IDs created for your project.
* A `.env` file containing your Google Drive credentials.

## Setup

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd <your-repository-directory>
    ```

2.  **Install dependencies:**

    ```bash
    npm i
    # or
    yarn
    ```

3.  **Create a `.env` file:**

    Create a `.env` file in the root directory of your project with the following variables:

    ```plaintext
    GOOGLE_CLIENT_ID=<your-google-client-id>
    GOOGLE_CLIENT_SECRET=<your-google-client-secret>
    GOOGLE_REFRESH_TOKEN=<your-google-refresh-token>
    GOOGLE_REDIRECT_URI=<your-google-redirect-uri>
    DRIVE_FOLDER_NAME=<your-google-drive-folder>
    ```

    * `GOOGLE_CLIENT_ID`: Your Google OAuth 2.0 Client ID.
    * `GOOGLE_CLIENT_SECRET`: Your Google OAuth 2.0 Client Secret.
    * `GOOGLE_REFRESH_TOKEN`: Your Google OAuth 2.0 Refresh Token.
    * `GOOGLE_REDIRECT_URI`: Your Google OAuth 2.0 Redirect URI.
    * `DRIVE_FOLDER_NAME`: The name of the Google Drive folder where you want to upload the file.
  

    **Important:** Ensure your `.env` file is added to your `.gitignore` to prevent sensitive credentials from being committed to your repository.

4.  **Obtain Google Cloud Credentials:**

    * Create a Google Cloud Platform project.
    * Enable the Google Drive API.
    * Create OAuth 2.0 Client IDs.
    * Obtain a refresh token. Instructions on how to get refresh token are available on the internet, or google's API documentation.
    
## Usage

To run the script, use the following command:

```bash
node --env-file .env index.js
or
npm run dev
```