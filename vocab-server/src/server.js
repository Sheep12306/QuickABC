const app = require('./app');
const sequelize = require('./db');
const config = require('./config');

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // 首次部署用 { alter: true } 自动建表，之后改回 sync() 即可
    const syncOption = process.env.DB_SYNC_ALTER === 'true' ? { alter: true } : {};
    await sequelize.sync(syncOption);
    console.log('Models synced.');

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
