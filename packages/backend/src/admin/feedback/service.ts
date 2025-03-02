import { eq } from 'drizzle-orm';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { nanoid } from 'nanoid';
import { type NewFeedback, feedbackTable } from '../../db/schema';
import { CreateFeedbackDto } from './types';

export class FeedbackService {
  constructor(private readonly db: DrizzleD1Database) {}

  async createFeedback(
    userId: string,
    data: CreateFeedbackDto
  ): Promise<{ id: string }> {
    const newFeedback: NewFeedback = {
      id: nanoid(),
      userId,
      ...data,
      status: 'open',
      priority: data.priority || 'medium',
    };

    await this.db.insert(feedbackTable).values(newFeedback);

    return { id: newFeedback.id };
  }

  async getFeedbackByUserId(userId: string) {
    return await this.db
      .select()
      .from(feedbackTable)
      .where(eq(feedbackTable.userId, userId));
  }

  async getAllFeedback() {
    return await this.db
      .select()
      .from(feedbackTable)
      .orderBy(feedbackTable.createdAt);
  }

  async updateFeedbackStatus(
    id: string,
    status: 'open' | 'in_progress' | 'closed'
  ) {
    await this.db
      .update(feedbackTable)
      .set({ status })
      .where(eq(feedbackTable.id, id));
  }

  async updateFeedbackPriority(
    id: string,
    priority: 'low' | 'medium' | 'high'
  ) {
    await this.db
      .update(feedbackTable)
      .set({ priority })
      .where(eq(feedbackTable.id, id));
  }

  async deleteFeedback(id: string) {
    await this.db.delete(feedbackTable).where(eq(feedbackTable.id, id));
  }
}
