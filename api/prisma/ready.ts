import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import util from "util";

const prisma = new PrismaClient();
const execAsync = util.promisify(exec);

const waitForDatabase = async (retries: number = 5, delay: number = 2000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await prisma.$connect();
            console.log("Database is up!");
            return;
        } catch {
            console.log(`Attempt ${i + 1} failed. Retrying in ${delay / 1000}s...`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    throw new Error("Database is not reachable after retries.");
};

const checkDatabaseAndMigrate = async () => {
    try {
        await waitForDatabase();
        console.log("Running Prisma migrations...");
        const { stdout, stderr } = await execAsync("npx prisma migrate dev");
        console.log(stdout);
        if (stderr) console.error(stderr);
        console.log("Migrations applied successfully.");
    } catch (error: any) {
        console.error("Error:", error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};

checkDatabaseAndMigrate();
