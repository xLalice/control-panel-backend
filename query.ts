import { prisma } from "./src/config/prisma";

(async () => {
  try {
    // Step 1: Fetch all rows
    const leads = await prisma.lead.findMany({where: {sheetName: "Manufacturer"}});

    // Step 2: Filter rows where `data` contains a "status" key
    const leadsToDelete = leads.filter(lead => {
      const data = lead.data as Record<string, unknown>;
      return data && typeof data === "object" && "status" in data;
    });

    // Step 3: Delete rows based on IDs
    if (leadsToDelete.length > 0) {
      const deleted = await prisma.lead.deleteMany({
        where: {
          id: {
            in: leadsToDelete.map(lead => lead.id),
          },
        },
      });
      console.log(`${deleted.count} leads deleted.`);
    } else {
      console.log("No leads to delete.");
    }
  } catch (error) {
    console.error("Error deleting leads:", error);
  } finally {
    await prisma.$disconnect();
  }
})();
