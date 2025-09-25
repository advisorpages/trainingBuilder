import { DataSource } from 'typeorm';
import { entities } from '../entities';
import { SnakeNamingStrategy } from './snake-naming.strategy';

// TypeORM configuration for migrations
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'leadership_training',
  entities: entities,
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  namingStrategy: new SnakeNamingStrategy(),
});

export default AppDataSource;
