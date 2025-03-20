## Generate a New Authorization Code Run the following command in your terminal (replace YOUR_CLIENT_ID and YOUR_REDIRECT_URI):
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=https://www.googleapis.com/auth/drive.file&access_type=offline&prompt=consent
or
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=https://www.googleapis.com/auth/drive&access_type=offline&prompt=consent

### It should receive something like this:
http://localhost:3333/auth/google/callback?code=<CODE>&scope=https://www.googleapis.com/auth/drive

## Exchange the Code for a Refresh Token Use a curl command or a Node.js script:

curl -X POST "https://oauth2.googleapis.com/token" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "client_id=YOUR_CLIENT_ID" \
-d "client_secret=YOUR_CLIENT_SECRET" \
-d "code=YOUR_AUTHORIZATION_CODE" \
-d "redirect_uri=YOUR_REDIRECT_URI" \
-d "grant_type=authorization_code"

The response will include a new refresh token. Save it in your .env file:
GOOGLE_REFRESH_TOKEN=your_new_refresh_token
