require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

// Database se connect karna
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Unhandled Promise Rejections handle karna (maslan DB connection fail hona)
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`);
  // Server band karke process exit karna
  server.close(() => process.exit(1));
});
