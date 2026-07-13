import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/lib/password.js";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (
    process.env.ADMIN_EMAIL ?? "info@websitediewerkt.nl"
  ).toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD is required in server/.env");
  }

  if (adminPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD moet minimaal ${MIN_PASSWORD_LENGTH} tekens bevatten`,
    );
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Website Die Werkt",
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  const demoProject = await prisma.project.findFirst({
    where: { name: "Demo Website" },
  });

  if (!demoProject) {
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (admin) {
      await prisma.project.create({
        data: {
          name: "Demo Website",
          targetUrl: "https://example.com",
          description: "Demo project voor lokale ontwikkeling",
          adminId: admin.id,
        },
      });
      console.log("Demo project created");
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
