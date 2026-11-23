import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  uri:
    process.env.MONGODB_URI ??
    process.env.DATABASE_URI ??
    'mongodb://localhost:27017/nest-mq',
}));

export default databaseConfig;
