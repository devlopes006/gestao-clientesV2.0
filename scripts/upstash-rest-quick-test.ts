import dotenv from 'dotenv'
import path from 'node:path'

// Load env from .env.local first, then fallback to default .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config()

async function main() {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!baseUrl || !token) {
    console.error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN')
    process.exit(1)
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  }

  const key = 'quicktest:foo'
  const value = 'bar'

  // SET
  const setUrl = new URL(
    `${baseUrl}/SET/${encodeURIComponent(key)}/${encodeURIComponent(value)}`
  )
  const setRes = await fetch(setUrl, { method: 'GET', headers })
  const setJson = await setRes.json()
  console.log('Upstash SET result:', setJson)

  // GET
  const getUrl = new URL(`${baseUrl}/GET/${encodeURIComponent(key)}`)
  const getRes = await fetch(getUrl, { method: 'GET', headers })
  const getJson = await getRes.json()
  console.log('Upstash GET result:', getJson)

  const result = Array.isArray(getJson?.result)
    ? getJson.result[0]
    : getJson?.result
  console.log('Upstash quick test value:', result)
}

main().catch((err) => {
  console.error('Upstash quick test failed:', err)
  process.exit(1)
})
