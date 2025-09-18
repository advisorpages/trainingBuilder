import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export async function createTestDatabase(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5433'),
    username: process.env.TEST_DB_USERNAME || 'test_user',
    password: process.env.TEST_DB_PASSWORD || 'test_password',
    database: process.env.TEST_DB_NAME || 'training_builder_test',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true, // Only for test environment
    logging: false,
    dropSchema: true, // Clean slate for each test run
    migrations: [],
    migrationsRun: false,
  });

  await dataSource.initialize();
  return dataSource;
}

export const testDatabaseConfig = {
  type: 'postgres' as const,
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5433'),
  username: process.env.TEST_DB_USERNAME || 'test_user',
  password: process.env.TEST_DB_PASSWORD || 'test_password',
  database: process.env.TEST_DB_NAME || 'training_builder_test',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: false,
  dropSchema: true,
};