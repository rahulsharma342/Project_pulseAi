import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    server.on('error', (error) => {
      console.error('Server startup error:', error);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error('Unable to start the server:', error);
    process.exitCode = 1;
  }
};

startServer();

