const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./src/config/db');

const app = express();
app.use(cors({
  origin: 'https://frabjous-profiterole-463cab.netlify.app',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',  require('./src/routes/auth.routes'));
app.use('/api/tasks', require('./src/routes/task.routes'));

app.get('/', (req, res) => {
  res.json({ message: '✅ Task Manager API is running!' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  });