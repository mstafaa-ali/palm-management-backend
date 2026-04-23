import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    const newLog = await prisma.workLog.create({
      data: {
        worker_nik: "6472032704720004",
        land_id: "5ad6ad16-7ea9-427f-949d-50074685db5d",
        check_in_time: new Date("2026-04-22T10:00:00.000Z"),
        check_out_time: new Date("2026-04-22T11:00:00.000Z"),
        tonase: 2.5,
      },
    });
    console.log("Success", newLog);
  } catch (e) {
    console.error("PRISMA ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
