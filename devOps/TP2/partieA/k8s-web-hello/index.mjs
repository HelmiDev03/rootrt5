import express from 'express'
import os from 'os'

const app = express()
const PORT = 3000

app.get('/', (req, res) => {
  const helloMessage = `VERSION 2: Hello from the ${os.hostname()}`
  console.log(helloMessage)
  res.send(helloMessage)
})

const server = app.listen(PORT, () => {
  console.log(`Web server is listening at port ${PORT}`)
})

// Arret propre quand Kubernetes envoie SIGTERM (suppression du pod, rolling update)
process.on('SIGTERM', () => server.close(() => process.exit(0)))
