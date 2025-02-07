export default function EmailVerifyTemplate({
  name,
  token,
}: {
  name: string;
  token: string;
}) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a
        href={`${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`}
      >
        Verify Email
      </a>
    </div>
  );
}
