import "dotenv/config";
import app from "./app.js";
import { prisma } from "./config/database.js";

const PORT = Number(process.env.PORT) || 5000;

await prisma.$connect();

await prisma.$queryRaw`SELECT 1`;

app.listen(PORT, () => {
  console.log(`Electronic Store API running on port ${PORT}`);
});