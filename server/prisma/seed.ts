import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const testUsers = [
    {
      email: 'anil@example.com',
      name: 'Anil Kumar',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      about: 'Available | Building full-stack apps 🚀',
      isOnline: true,
    },
    {
      email: 'sarah@example.com',
      name: 'Sarah Jenkins',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      about: 'At work 💻',
      isOnline: true,
    },
    {
      email: 'david@example.com',
      name: 'David Chen',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      about: 'Code. Sleep. Repeat.',
      isOnline: false,
    },
    {
      email: 'emma@example.com',
      name: 'Emma Watson',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
      about: 'Exploring the world 🌍',
      isOnline: true,
    },
  ];

  for (const user of testUsers) {
    const upserted = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        avatarUrl: user.avatarUrl,
        about: user.about,
        isOnline: user.isOnline,
      },
      create: user,
    });
    console.log(`✅ Seeded user: ${upserted.name} (${upserted.email})`);
  }

  console.log('🎉 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
