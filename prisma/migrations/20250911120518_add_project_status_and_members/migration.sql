-- CreateTable
CREATE TABLE "public"."Project_Status" (
    "project_status_id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_Status_pkey" PRIMARY KEY ("project_status_id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "project_id" BIGSERIAL NOT NULL,
    "unique_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "project_status_id" BIGINT NOT NULL,
    "created_by_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "public"."Project_Member" (
    "project_member_id" BIGSERIAL NOT NULL,
    "project_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_Member_pkey" PRIMARY KEY ("project_member_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_unique_id_key" ON "public"."Project"("unique_id");

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_project_status_id_fkey" FOREIGN KEY ("project_status_id") REFERENCES "public"."Project_Status"("project_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project_Member" ADD CONSTRAINT "Project_Member_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project_Member" ADD CONSTRAINT "Project_Member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
