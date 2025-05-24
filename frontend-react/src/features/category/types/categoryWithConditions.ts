import { Category, Condition } from "../../announcement/api/getAnnouncement";

export interface CategoryWithConditions extends Category {
  conditions: Condition[];
}
