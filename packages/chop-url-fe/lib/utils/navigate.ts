export const navigate = {
  auth: () => {
    window.location.href = '/auth';
  },
  dashboard: () => {
    window.location.href = '/dashboard';
  },
  register: () => {
    window.location.href = '/auth/register';
  },
  forgotPassword: () => {
    window.location.href = '/auth/forgot-password';
  },
};
