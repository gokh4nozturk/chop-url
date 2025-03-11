import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { Logo } from '../components/logo';

interface VerifyEmailProps {
  name: string;
  verificationLink: string;
}

export const VerifyEmail = ({ name, verificationLink }: VerifyEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address for ChopURL</Preview>
    <Body style={main}>
      <Container style={container}>
        <Logo />
        <Heading style={h1}>Hello {name},</Heading>
        <Text style={text}>Thank you for creating a ChopURL account.</Text>
        <Text style={text}>
          Click the button below to verify your email address:
        </Text>
        <Link href={verificationLink} style={button}>
          Verify Email Address
        </Link>
        <Text style={text}>
          Or copy and paste the following link into your browser:
        </Text>
        <Text style={link}>{verificationLink}</Text>
        <Text style={text}>This link will expire in 24 hours.</Text>
        <Text style={text}>
          If you did not create this account, you can ignore this email.
        </Text>
        <Text style={footer}>
          Best regards,
          <br />
          ChopURL Team
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const logo = {
  borderRadius: '50%',
  margin: '0 auto 24px',
  display: 'block',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
};

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const button = {
  backgroundColor: '#0070f3',
  borderRadius: '5px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '50px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '100%',
  marginTop: '24px',
  marginBottom: '24px',
};

const link = {
  color: '#0070f3',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 16px',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '48px 0 0',
};
