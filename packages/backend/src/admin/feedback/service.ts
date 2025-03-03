import { eq } from 'drizzle-orm';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { nanoid } from 'nanoid';
import { feedbackTable } from '../../db/schema';
import { CreateFeedbackDto } from './types';

export class FeedbackService {
  constructor(private readonly db: DrizzleD1Database) {}

  async createFeedback(
    userId: string,
    data: CreateFeedbackDto
  ): Promise<{ id: string }> {
    const id = nanoid();

    await this.db.insert(feedbackTable).values({
      id,
      userId,
      title: data.title,
      description: data.description,
      category: data.category,
    });

    return { id };
  }

  async getFeedbackByUserId(userId: string) {
    return await this.db
      .select()
      .from(feedbackTable)
      .where(eq(feedbackTable.userId, userId));
  }

  async getAllFeedback() {
    return await this.db.select().from(feedbackTable);
  }

  async updateFeedbackStatus(
    id: string,
    status: 'open' | 'in_progress' | 'closed'
  ) {
    await this.db
      .update(feedbackTable)
      .set({
        // @ts-ignore
        status,
      })
      .where(eq(feedbackTable.id, id));
  }

  async updateFeedbackPriority(
    id: string,
    priority: 'low' | 'medium' | 'high'
  ) {
    await this.db
      .update(feedbackTable)
      .set({
        // @ts-ignore
        priority,
      })
      .where(eq(feedbackTable.id, id));
  }

  async deleteFeedback(id: string) {
    await this.db.delete(feedbackTable).where(eq(feedbackTable.id, id));
  }
}
