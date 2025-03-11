import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { Logo } from '../components/logo';

interface UsageReportProps {
  name: string;
  stats: {
    totalUrls: number;
    totalVisits: number;
    topUrls: Array<{
      shortUrl: string;
      originalUrl: string;
      visits: number;
    }>;
    periodStart: Date;
    periodEnd: Date;
  };
  frontendUrl: string;
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const UsageReport = ({ name, stats, frontendUrl }: UsageReportProps) => (
  <Html>
    <Head />
    <Preview>
      Your ChopURL Usage Report ({formatDate(stats.periodStart)} -{' '}
      {formatDate(stats.periodEnd)})
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Logo />
        <Heading style={h1}>Hello {name},</Heading>
        <Text style={text}>Here's your URL usage report for the period:</Text>
        <Text style={periodText}>
          {formatDate(stats.periodStart)} - {formatDate(stats.periodEnd)}
        </Text>

        <Section style={statsSection}>
          <Heading as="h2" style={h2}>
            Summary
          </Heading>
          <Row>
            <Column align="center">
              <Text style={statNumber}>{stats.totalUrls}</Text>
              <Text style={statLabel}>Total URLs</Text>
            </Column>
            <Column align="center">
              <Text style={statNumber}>{stats.totalVisits}</Text>
              <Text style={statLabel}>Total Visits</Text>
            </Column>
          </Row>
        </Section>

        <Section>
          <Heading as="h2" style={h2}>
            Top Performing URLs
          </Heading>
          <table style={table}>
            <thead>
              <tr>
                <th style={tableHeader}>Short URL</th>
                <th style={tableHeader}>Original URL</th>
                <th style={tableHeader}>Visits</th>
              </tr>
            </thead>
            <tbody>
              {stats.topUrls.map((url) => (
                <tr key={url.shortUrl}>
                  <td style={tableCell}>
                    <Link href={url.shortUrl} style={urlLink}>
                      {url.shortUrl}
                    </Link>
                  </td>
                  <td style={tableCell}>
                    <Link href={url.originalUrl} style={originalUrlLink}>
                      {url.originalUrl.length > 50
                        ? `${url.originalUrl.substring(0, 47)}...`
                        : url.originalUrl}
                    </Link>
                  </td>
                  <td style={{ ...tableCell, textAlign: 'center' }}>
                    {url.visits}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section style={ctaSection}>
          <Link href={`${frontendUrl}/dashboard/analytics`} style={button}>
            View Full Analytics
          </Link>
        </Section>

        <Hr style={divider} />

        <Text style={disclaimer}>
          You're receiving this email because you have enabled usage reports for
          your ChopURL account. To change your email preferences, visit your{' '}
          <Link href={`${frontendUrl}/dashboard/settings`} style={inlineLink}>
            account settings
          </Link>
          .
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
  maxWidth: '600px',
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

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 16px',
};

const text = {
  color: '#666',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 12px',
};

const periodText = {
  color: '#666',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 24px',
};

const statsSection = {
  backgroundColor: '#f5f5f5',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
};

const statNumber = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#0070f3',
  margin: '0 0 8px',
};

const statLabel = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  marginTop: '16px',
};

const tableHeader = {
  padding: '12px',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ddd',
  textAlign: 'left' as const,
  fontSize: '14px',
  fontWeight: '600',
  color: '#333',
};

const tableCell = {
  padding: '12px',
  border: '1px solid #ddd',
  fontSize: '14px',
  color: '#444',
};

const urlLink = {
  color: '#0070f3',
  textDecoration: 'none',
};

const originalUrlLink = {
  color: '#666',
  textDecoration: 'none',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
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
  padding: '0 32px',
};

const divider = {
  borderTop: '1px solid #eaeaea',
  margin: '32px 0',
};

const disclaimer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0',
};

const inlineLink = {
  color: '#0070f3',
  textDecoration: 'none',
};
