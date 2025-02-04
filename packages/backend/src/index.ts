import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ChopUrl, QRCodeGenerator } from '@chop-url/lib'
import { nanoid } from 'nanoid'
import { AuthRequest, User, createSession, createUser, deleteSession, getUserById, isValidEmail, isValidPassword, verifySession, verifyUser } from './auth.js'

export interface Env {
  DB: D1Database;
  BASE_URL: string;
}

type Variables = {
  user: User;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('*', cors({
  origin: ['http://localhost:3000', 'https://app.chop-url.com'],
  credentials: true,
}))

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Auth middleware
async function authMiddleware(c: any, next: () => Promise<void>) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const user = await verifySession(c.env, token)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('user', user)
  await next()
}

// Auth endpoints
app.post('/api/auth/register', async (c) => {
  const body = await c.req.json<AuthRequest>()
  const { email, password } = body

  // Validate input
  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  if (!isValidEmail(email)) {
    return c.json({ error: 'Invalid email format' }, 400)
  }

  if (!isValidPassword(password)) {
    return c.json({ error: 'Password must be at least 8 characters long' }, 400)
  }

  try {
    const user = await createUser(c.env, email, password)
    const token = await createSession(c.env, user.id)

    return c.json({ user, token })
  } catch (error) {
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Email already exists' }, 409)
    }
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json<AuthRequest>()
  const { email, password } = body

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  const user = await verifyUser(c.env, email, password)
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = await createSession(c.env, user.id)
  return c.json({ user, token })
})

app.post('/api/auth/logout', authMiddleware, async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (token) {
    await deleteSession(c.env, token)
  }
  return c.json({ success: true })
})

app.get('/api/auth/me', authMiddleware, async (c) => {
  const user = c.get('user')
  return c.json({ user })
})

app.post('/api/shorten', async (c) => {
  const body = await c.req.json<{ url: string; customSlug?: string }>()
  const { url, customSlug } = body

  if (!url) {
    return c.json({ error: 'URL is required' }, 400)
  }

  try {
    new URL(url)
  } catch {
    return c.json({ error: 'Invalid URL' }, 400)
  }

  // Get user from auth (optional)
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const user = token ? await verifySession(c.env, token) : null

  try {
    const shortId = customSlug || nanoid(6)
    const result = await c.env.DB.prepare(
      'INSERT INTO urls (short_id, original_url, custom_slug, user_id) VALUES (?, ?, ?, ?) RETURNING *'
    )
      .bind(shortId, url, customSlug || null, user?.id || null)
      .first<{ short_id: string }>()

    if (!result) {
      throw new Error('Failed to create short URL')
    }

    return c.json({
      shortUrl: `${c.env.BASE_URL}/${result.short_id}`,
      shortId: result.short_id,
    })
  } catch (error) {
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Custom slug already exists' }, 409)
    }
    return c.json({ error: 'Failed to create short URL' }, 500)
  }
})

app.get('/api/urls', authMiddleware, async (c) => {
  const user = c.get('user')
  const urls = await c.env.DB.prepare(
    'SELECT * FROM urls WHERE user_id = ? ORDER BY created_at DESC'
  )
    .bind(user.id)
    .all()

  return c.json(urls)
})

app.get('/api/:shortId', async (c) => {
  try {
    const shortId = c.req.param('shortId')
    const chopUrl = new ChopUrl({
      baseUrl: c.env.BASE_URL,
      db: c.env.DB
    })

    const originalUrl = await chopUrl.getOriginalUrl(shortId)
    return c.json({ url: originalUrl })
  } catch (error) {
    if (error instanceof Error && error.message === 'URL not found') {
      return c.json({ error: 'URL not found' }, 404)
    }
    console.error('Error expanding URL:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.get('/api/stats/:shortId', async (c) => {
  try {
    const shortId = c.req.param('shortId')
    const chopUrl = new ChopUrl({
      baseUrl: c.env.BASE_URL,
      db: c.env.DB
    })

    const stats = await chopUrl.getUrlStats(shortId)
    return c.json(stats)
  } catch (error) {
    if (error instanceof Error && error.message === 'URL not found') {
      return c.json({ error: 'URL not found' }, 404)
    }
    console.error('Error getting URL stats:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app 