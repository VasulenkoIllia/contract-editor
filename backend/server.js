const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection, initDb } = require('./config/db');
const templatesRoutes = require('./routes/templates');
const counterpartiesRoutes = require('./routes/counterparties');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/templates', templatesRoutes);
app.use('/api/counterparties', counterpartiesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// Initialize database and start server
(async () => {
  // Test database connection
  await testConnection();

  // Initialize database
  await initDb();

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
