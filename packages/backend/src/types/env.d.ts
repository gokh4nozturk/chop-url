declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      FRONTEND_URL: string;
      RESEND_API_KEY: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GITHUB_CLIENT_ID: string;
      GITHUB_CLIENT_SECRET: string;
    }
  }

  interface Env {
    DB: D1Database;
    BASE_URL: string;
    FRONTEND_URL: string;
    RESEND_API_KEY: string;
    ENVIRONMENT: 'development' | 'test' | 'production';
  }
}
