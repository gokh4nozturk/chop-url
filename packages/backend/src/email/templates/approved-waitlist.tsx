import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ApprovedWaitListEmailProps {
  temporaryPassword: string;
  loginUrl: string;
}

export const ApprovedWaitListEmail = ({
  temporaryPassword,
  loginUrl,
}: ApprovedWaitListEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Chop URL - Your Account is Ready!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://storage.chop-url.com/assets/logo.svg"
          alt="ChopURL Logo"
          width="100"
          height="100"
          style={logo}
        />
        <Heading style={h1}>Welcome to Chop URL!</Heading>
        <Text style={text}>
          Your waitlist application has been approved and your account is now
          ready to use. Here are your temporary login credentials:
        </Text>
        <Text style={passwordContainer}>
          Temporary Password: <strong>{temporaryPassword}</strong>
        </Text>
        <Text style={text}>
          For security reasons, please change your password after your first
          login.
        </Text>
        <Link href={loginUrl} style={button}>
          Login to Your Account
        </Link>
        <Text style={footer}>
          If you did not request this account, please ignore this email.
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

const passwordContainer = {
  backgroundColor: '#f4f4f4',
  borderRadius: '4px',
  padding: '16px',
  margin: '24px 0',
  color: '#444',
  fontSize: '16px',
  lineHeight: '24px',
};

const button = {
  backgroundColor: '#000',
  borderRadius: '4px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '50px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '100%',
  marginTop: '24px',
};

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '48px 0 0',
};

const logo = {
  width: '100px',
  height: '100px',
  marginBottom: '20px',
};
