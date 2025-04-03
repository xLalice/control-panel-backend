import { AccessControl } from "accesscontrol";

const ac = new AccessControl();

// Base roles with minimal permissions
ac.grant("base")
  .read("dashboard");

// Department-specific roles
ac.grant("sales")
  .extend("base")
  .read("leads")
  .create("leads")
  .update("leads")
  .delete("leads");

ac.grant("marketing")
  .extend("base")
  .read(["marketing-plans", "marketing-calendar"])
  .create(["marketing-plans", "marketing-calendar"])
  .update(["marketing-plans", "marketing-calendar"])
  .delete(["marketing-plans", "marketing-calendar"]);

ac.grant("logistics")
  .extend("base")
  .read("inventory")
  .update("inventory");

ac.grant("reports-viewer")
  .extend("base")
  .read("reports");

ac.grant("pricing-manager")
  .extend("base")
  .read("price-list")
  .update("price-list");

ac.grant("accounting")
  .extend("base")
  .read(["incoming-accounts", "outgoing-accounts"])
  .create(["incoming-accounts", "outgoing-accounts"])
  .update(["incoming-accounts", "outgoing-accounts"]);

ac.grant("hr")
  .extend("base")
  .read("human-resources")
  .create("human-resources")
  .update("human-resources")
  .delete("human-resources");

ac.grant("officer")
  .extend("base")
  .read("management")
  .update("management");

ac.grant("purchasing")
  .extend("base")
  .read("purchase-orders")
  .create("purchase-orders")
  .update("purchase-orders");

ac.grant("procurement")
  .extend("base")
  .read("procurement")
  .create("procurement")
  .update("procurement");

// Admin role with full access
ac.grant("admin")
  .extend([
    "sales",
    "marketing",
    "logistics",
    "reports-viewer",
    "pricing-manager",
    "accounting",
    "hr",
    "officer",
    "purchasing",
    "procurement"
  ])
  .createAny("*")
  .readAny("*")
  .updateAny("*")
  .deleteAny("*");

export default ac;