// Script per aggiungere il campo profile_image_url al database
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addProfileImageUrl() {
  try {
    console.log("Aggiunta colonna profile_image_url alla tabella User...");
    
    // Esegui la migration SQL direttamente
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "profile_image_url" VARCHAR(255) NULL;
    `;
    
    console.log("✅ Colonna profile_image_url aggiunta con successo!");
    console.log("\n⚠️  IMPORTANTE: Ferma il server e rigenera il client Prisma con:");
    console.log("   npx prisma generate");
    console.log("\n   Poi riavvia il server.");
  } catch (error) {
    console.error("❌ Errore:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addProfileImageUrl();

