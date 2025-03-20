import { withSchema } from '@/db/helpers';
import { eq } from 'drizzle-orm';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { nanoid } from 'nanoid';
import { feedbackTable } from '../../db/schema';
import {
  CreateFeedbackDto,
  FeedbackPriority,
  FeedbackResponse,
  FeedbackStatus,
} from './types';

export class FeedbackService {
  constructor(private readonly db: DrizzleD1Database) {}

  async createFeedback(
    userId: string,
    data: CreateFeedbackDto
  ): Promise<{ id: string }> {
    const id = nanoid();

    await this.db.insert(feedbackTable).values(
      withSchema({
        id,
        userId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
      })
    );

    return { id };
  }

  async getFeedbackByUserId(userId: string): Promise<FeedbackResponse[]> {
    const results = await this.db
      .select()
      .from(feedbackTable)
      .where(eq(feedbackTable.userId, userId));

    return results.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  async getAllFeedback(): Promise<FeedbackResponse[]> {
    const results = await this.db.select().from(feedbackTable);

    return results.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  async updateFeedbackStatus(
    id: string,
    status: FeedbackStatus
  ): Promise<void> {
    await this.db
      .update(feedbackTable)
      .set(withSchema({ status }))
      .where(eq(feedbackTable.id, id));
  }

  async updateFeedbackPriority(
    id: string,
    priority: FeedbackPriority
  ): Promise<void> {
    await this.db
      .update(feedbackTable)
      .set(withSchema({ priority }))
      .where(eq(feedbackTable.id, id));
  }

  async deleteFeedback(id: string): Promise<void> {
    await this.db.delete(feedbackTable).where(eq(feedbackTable.id, id));
  }

  async getFeedbackById(id: string): Promise<FeedbackResponse[]> {
    const result = await this.db
      .select()
      .from(feedbackTable)
      .where(eq(feedbackTable.id, id));

    if (result.length === 0) {
      throw new Error('Feedback not found');
    }

    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }
}
