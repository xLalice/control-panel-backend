import { AccessControl } from "accesscontrol";

const ac = new AccessControl();


ac.grant("MARKETING")
  .extend("intern") // Marketers inherit intern permissions
  .update("social-media")
  .delete("social-media");

ac.grant("admin")
  .extend("marketer")
  .createAny(["user-management", "reports"])
  .readAny(["user-management", "reports"])
  .updateAny(["user-management", "reports"])
  .deleteAny(["user-management", "reports"]);

export default ac;
