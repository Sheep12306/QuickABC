const { Sequelize } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'mysql',
  logging: config.nodeEnv === 'development' ? console.log : false,
  define: {
    timestamps: false,
    underscored: true,
  },
});

module.exports = sequelize;
