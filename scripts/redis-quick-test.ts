import dotenv from 'dotenv'
import path from 'node:path'
import { createClient, type RedisClientType } from 'redis'

// Load env from .env.local first, then fallback to default .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config()

async function main() {
  const url = process.env.REDIS_URL

  let client: RedisClientType

  if (url) {
    client = createClient({ url })
  } else {
    const host = process.env.REDIS_HOST || '127.0.0.1'
    const port = Number(process.env.REDIS_PORT || '6379')
    const username = process.env.REDIS_USERNAME || undefined
    const password = process.env.REDIS_PASSWORD || undefined

    client = createClient({
      socket: { host, port },
      username,
      password,
    })
  }

  client.on('error', (err) => {
    console.error('Redis Client Error', err)
  })

  await client.connect()

  // Write & read a test key
  const testKey = 'quicktest:foo'
  await client.set(testKey, 'bar', { EX: 60 })
  const result = await client.get(testKey)

  console.log('Redis quick test result:', result)

  await client.quit()
}

main().catch((err) => {
  console.error('Redis quick test failed:', err)
  process.exit(1)
})
