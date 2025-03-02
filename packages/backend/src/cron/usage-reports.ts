import { D1Database } from '@cloudflare/workers-types';
import { eq } from 'drizzle-orm';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { createDb } from '../db/client';
import { users } from '../db/schema/users';
import { EmailService } from '../email/service';
import { UrlService } from '../url/service';

interface Config {
  resendApiKey: string;
  baseUrl: string;
  frontendUrl: string;
}

interface Analytics {
  totalClicks: number;
  uniqueVisitors: number;
  countries: { name: string; count: number }[];
  cities: { name: string; count: number }[];
  regions: { name: string; count: number }[];
  timezones: { name: string; count: number }[];
  referrers: { name: string; count: number }[];
  devices: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  operatingSystems: { name: string; count: number }[];
  clicksByDate: { date: string; count: number }[];
}

export async function sendWeeklyUsageReports(
  database: DrizzleD1Database<Record<string, unknown>> & {
    $client: D1Database;
  },
  config: Config
): Promise<void> {
  try {
    console.log('Starting weekly usage reports job');

    const emailService = new EmailService(
      config.resendApiKey,
      config.frontendUrl
    );
    const db = createDb(database.$client);
    const urlService = new UrlService(config.baseUrl, db);

    // Get all users
    const allUsers = await database
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        isEmailVerified: users.isEmailVerified,
      })
      .from(users)
      .where(eq(users.isEmailVerified, true))
      .all();

    console.log(`Found ${allUsers.length} verified users`);

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 7); // Last 7 days

    // Send reports for each user
    for (const user of allUsers) {
      try {
        console.log(`Processing report for user ${user.id}`);

        // Get user's analytics
        const analytics = (await urlService.getUserAnalytics(
          user.id.toString(),
          '7d'
        )) as Analytics;

        // Get top URLs from referrers
        const topUrls = analytics.referrers
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((referrer) => ({
            shortUrl: referrer.name,
            originalUrl: referrer.name,
            visits: referrer.count,
          }));

        // Send email
        await emailService.sendUsageReportEmail(
          user.email,
          user.name,
          {
            totalUrls: analytics.referrers.length,
            totalVisits: analytics.totalClicks,
            topUrls,
            periodStart,
            periodEnd,
          },
          config.frontendUrl
        );

        console.log(`Successfully sent report to user ${user.id}`);
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    }

    console.log('Weekly usage reports job completed');
  } catch (error) {
    console.error('Error in weekly usage reports job:', error);
    throw error;
  }
}
