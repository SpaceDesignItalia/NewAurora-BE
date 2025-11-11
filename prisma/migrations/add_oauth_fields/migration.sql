-- Migration: Aggiungi campi OAuth al modello User
-- Aggiunge supporto per autenticazione OAuth (Google e GitHub)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "oauth_provider" VARCHAR(50) NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "oauth_id" VARCHAR(255) NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "oauth_access_token" TEXT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_email_verified" BOOLEAN DEFAULT FALSE;

-- Modifica password per essere nullable (utenti OAuth non hanno password)
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Indici per ricerca rapida
CREATE INDEX IF NOT EXISTS "idx_users_oauth" ON "User"("oauth_provider", "oauth_id");
CREATE INDEX IF NOT EXISTS "idx_users_email_oauth" ON "User"("email", "oauth_provider");

