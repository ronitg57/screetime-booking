
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Seed Screens
  const screensData = [
    {
      name: 'Library Entrance Screen',
      location: 'Main Library, Ground Floor Entrance',
      specs: '55" LED, 4K Resolution, High Brightness',
      imageUrl: 'https://placehold.co/600x400.png',
      dataAiHint: "library entrance",
    },
    {
      name: 'Cafeteria Main Display',
      location: 'Student Cafeteria, West Wall',
      specs: '70" LCD, Full HD, Wide Viewing Angle',
      imageUrl: 'https://placehold.co/600x400.png',
      dataAiHint: "cafeteria display",
    },
    {
      name: 'Student Lounge Interactive',
      location: 'Student Lounge, Near Coffee Bar',
      specs: '65" OLED, 4K Touchscreen, Interactive Kiosk',
      imageUrl: 'https://placehold.co/600x400.png',
      dataAiHint: "lounge interactive",
    },
    {
      name: 'Tech Hub Screen Alpha',
      location: 'Tech Building, 1st Floor Hallway',
      specs: '42" LCD, Portrait Mode, Info Display',
      imageUrl: 'https://placehold.co/400x600.png',
      dataAiHint: "tech hub",
    },
  ];

  for (const screen of screensData) {
    await prisma.screen.upsert({
      where: { name: screen.name },
      update: {},
      create: screen,
    });
    console.log(`Created/Updated screen: ${screen.name}`);
  }

  // Seed Admin User
  const adminUsername = process.env.INITIAL_ADMIN_USERNAME || 'admin';
  // IMPORTANT: Use a strong, unique password and hash it properly.
  // This is an example hash for "adminpassword". Generate your own for production.
  // You can generate a hash using an online tool or a script:
  // const salt = bcrypt.genSaltSync(10);
  // const hashedPassword = bcrypt.hashSync("yourchosenpassword", salt); console.log(hashedPassword)
  const adminPasswordHash = process.env.INITIAL_ADMIN_PASSWORD_HASH || bcrypt.hashSync("adminpassword", 10);


  const existingAdmin = await prisma.admin.findUnique({ where: { username: adminUsername } });
  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        username: adminUsername,
        password: adminPasswordHash,
      },
    });
    console.log(`Created admin user: ${adminUsername}`);
  } else {
    console.log(`Admin user ${adminUsername} already exists. Updating password if necessary.`);
    // Optionally update password if it's different or if you want to enforce a new one via .env
    if(existingAdmin.password !== adminPasswordHash && process.env.INITIAL_ADMIN_PASSWORD_HASH){
        await prisma.admin.update({
            where: {username: adminUsername},
            data: {password: adminPasswordHash}
        });
        console.log(`Updated password for admin user: ${adminUsername}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
