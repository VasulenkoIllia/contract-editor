const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'contract_editor',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'db',
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ESOCKETTIMEDOUT/,
        /EHOSTDOWN/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 5
    }
  }
);

const initializeDatabase = async () => {
  try {
    // Проверяем соединение
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Создаем базу если не существует (только для PostgreSQL)
    try {
      await sequelize.query(`CREATE DATABASE "${process.env.DB_NAME || 'contract_editor'}";`);
      console.log('Database created successfully');
    } catch (createError) {
      if (createError.original && createError.original.code !== '42P04') { // 42P04 = database already exists
        throw createError;
      }
    }

    // Синхронизируем модели
    await sequelize.sync({ force: false });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to initialize database:', error);
    process.exit(1); // Завершаем процесс с ошибкой
  }
};

module.exports = {
  sequelize,
  initializeDatabase
};
