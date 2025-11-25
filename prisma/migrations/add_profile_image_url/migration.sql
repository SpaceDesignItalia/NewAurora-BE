-- Add profile_image_url column to users table
ALTER TABLE "User" 
ADD COLUMN "profile_image_url" VARCHAR(255) NULL;

