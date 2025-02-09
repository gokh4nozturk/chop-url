# Chop URL Backend

## Development Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure Wrangler:
   - Copy `wrangler.example.toml` to `wrangler.toml`:
   ```bash
   cp wrangler.example.toml wrangler.toml
   ```
   - Update the following values in your `wrangler.toml`:
     - `RESEND_API_KEY`: Your Resend API key
     - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
     - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Your Google OAuth credentials
     - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: Your GitHub OAuth credentials
     - `database_id`: Your D1 database IDs for both local and production environments

4. Start the development server:
```bash
npm run dev
```

## Security Note

The `wrangler.toml` file contains sensitive information and is not tracked in git. Make sure to never commit this file and keep your API keys and secrets secure. 