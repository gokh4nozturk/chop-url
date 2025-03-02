export interface H {
  Bindings: {
    DB: D1Database;
    BASE_URL: string;
    RESEND_API_KEY: string;
    FRONTEND_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
  };
  Variables: {
    user: {
      id: number;
      email: string;
      name: string;
    };
  };
}
