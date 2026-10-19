import express from 'express'
import os from 'os'

const app = express()
const PORT = 3000

app.get('/', (req, res) => {
  const helloMessage = `Hello from the ${os.hostname()}`
  console.log(helloMessage)
  res.send(helloMessage)
})

// Deuxieme endpoint : appel du Service "nginx" par son nom DNS interne au cluster
app.get('/nginx', async (req, res) => {
  const url = 'http://nginx'
  const response = await fetch(url)
  const body = await response.text()
  res.send(body)
})

const server = app.listen(PORT, () => {
  console.log(`Web server is listening at port ${PORT}`)
})

process.on('SIGTERM', () => server.close(() => process.exit(0)))
