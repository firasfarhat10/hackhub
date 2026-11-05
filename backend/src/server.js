const env = require('./config/env'); // en premier : charge et vérifie .env
const connectDB = require('./config/db');
const app = require('./app');

(async () => {
  try {
    await connectDB(env.mongoUri);
    app.listen(env.port, () => {
      console.log(`API HackHub sur http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error('Demarrage impossible :', err.message);
    process.exit(1);
  }
})();