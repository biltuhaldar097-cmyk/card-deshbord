require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { connectDB } = require('./db');

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET environment variable');
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD) {
  console.error('Missing ADMIN_PASSWORD environment variable');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI environment variable');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, database: 'mongodb' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/requests'));
app.use('/api/admin', require('./routes/admin'));

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const port = Number(process.env.PORT || 3000);

async function start() {
  try {
    await connectDB();
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
}

start();
