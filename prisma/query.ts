import { prisma } from "../src/config/prisma";

(async () => await prisma.session.deleteMany())();