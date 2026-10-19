import express from 'express'
import os from 'os'
import { createClient } from 'redis'

const PORT = 3000
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379'
const VERSION = process.env.APP_VERSION || '1.0.0'

// Connexion a Redis via le nom DNS du Service ClusterIP "redis"
const redis = createClient({ url: REDIS_URL })
redis.on('error', (err) => console.error(`Erreur Redis : ${err.message}`))
await redis.connect()
console.log(`Connecte a Redis (${REDIS_URL})`)

const app = express()

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', pod: os.hostname() })
})

app.get('/api/visits', async (req, res) => {
  const visits = await redis.incr('visits')
  console.log(`Visite #${visits} servie par ${os.hostname()}`)
  res.json({ visits, servedBy: os.hostname(), version: VERSION })
})

const server = app.listen(PORT, () => {
  console.log(`API en ecoute sur le port ${PORT}`)
})

process.on('SIGTERM', () => {
  server.close(async () => {
    await redis.close()
    process.exit(0)
  })
})
