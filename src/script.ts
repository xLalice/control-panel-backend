import { prisma } from "./config/prisma";

(async () => {
    await prisma.pageMetric.deleteMany();
    await prisma.postMetric.deleteMany();
    await prisma.post.deleteMany();
})()