import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ChopUrl } from '@chop-url/lib'

interface Env {
  DB: D1Database;
  BASE_URL: string;
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.post('/api/shorten', async (c) => {
  try {
    const { url } = await c.req.json()
    if (!url) {
      return c.json({ error: 'URL is required' }, 400)
    }

    console.log('Creating ChopUrl instance with:', {
      baseUrl: c.env.BASE_URL,
      db: typeof c.env.DB
    })

    const chopUrl = new ChopUrl({
      baseUrl: c.env.BASE_URL,
      db: c.env.DB
    })

    console.log('Attempting to create short URL for:', url)
    const urlInfo = await chopUrl.createShortUrl(url)
    console.log('Successfully created short URL:', urlInfo)
    return c.json(urlInfo)
  } catch (error) {
    console.error('Error shortening URL:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack)
      return c.json({ error: error.message }, 500)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
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

export default app 