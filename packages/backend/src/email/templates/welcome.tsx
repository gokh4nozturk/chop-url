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

interface WelcomeEmailProps {
  name: string;
  dashboardUrl: string;
}

export const WelcomeEmail = ({ name, dashboardUrl }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Chop URL!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://storage.chop-url.com/assets/logo.svg"
          alt="ChopURL Logo"
          width="100"
          height="100"
          style={logo}
        />
        <Heading style={h1}>Hello {name},</Heading>
        <Text style={text}>
          Welcome to ChopURL! We're excited to have you on board.
        </Text>
        <Text style={text}>Click the button below to get started:</Text>
        <Link href={dashboardUrl} style={button}>
          Get Started
        </Link>
        <Text style={text}>
          Or copy and paste the following link into your browser:
        </Text>
        <Text style={link}>{dashboardUrl}</Text>
        <Text style={text}>
          We're here to help you create and manage your URLs.
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
