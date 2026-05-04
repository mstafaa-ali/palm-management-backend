-- CreateTable
CREATE TABLE "work_logs" (
    "id" UUID NOT NULL,
    "worker_nik" VARCHAR(50) NOT NULL,
    "land_id" UUID NOT NULL,
    "check_in_time" TIMESTAMP(3) NOT NULL,
    "check_out_time" TIMESTAMP(3) NOT NULL,
    "tonase" DECIMAL(10,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_worker_nik_fkey" FOREIGN KEY ("worker_nik") REFERENCES "users"("nik") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_land_id_fkey" FOREIGN KEY ("land_id") REFERENCES "lands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
