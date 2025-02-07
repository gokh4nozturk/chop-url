import EmailVerifyTemplate from './template';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function POST(req: Request) {
  const { token, email, name } = await req.json();
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Chop URL <verify@chopurl.com>',
      to: [email],
      subject: 'Chop URL - Verify your email',
      react: EmailVerifyTemplate({ name, token }),
    }),
  });

  if (res.ok) {
    const data = await res.json();
    return Response.json(data);
  }
}
