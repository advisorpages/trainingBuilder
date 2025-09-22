import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Role } from '../../packages/backend/src/entities/index';

// --- Configuration ---
const usersToCreate = [
  {
    email: 'sarah.content@company.com',
    roleName: 'Content Developer',
  },
  {
    email: 'john.trainer@company.com',
    roleName: 'Trainer',
  },
  {
    email: 'broker1@company.com',
    roleName: 'Broker',
  },
];
const password = 'Password123!';

// --- Script ---

async function createUsers() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'leadership_training',
    entities: [User, Role],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');

    const userRepo = dataSource.getRepository(User);
    const roleRepo = dataSource.getRepository(Role);

    const passwordHash = await bcrypt.hash(password, 10);

    for (const userData of usersToCreate) {
      const existingUser = await userRepo.findOne({ where: { email: userData.email } });

      if (existingUser) {
        console.log(`⚠️ User ${userData.email} already exists. Skipping.`);
        continue;
      }

      const role = await roleRepo.findOne({ where: { name: userData.roleName } });
      if (!role) {
        console.error(`❌ Role '${userData.roleName}' not found. Please ensure roles are seeded first.`);
        continue;
      }

      const newUser = userRepo.create({
        email: userData.email,
        passwordHash,
        roleId: role.id,
        isActive: true,
      });

      await userRepo.save(newUser);
      console.log(`✅ Successfully created user: ${userData.email}`);
    }

  } catch (error) {
    console.error('❌ User creation script failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('📦 Database connection closed');
  }
}

createUsers();
