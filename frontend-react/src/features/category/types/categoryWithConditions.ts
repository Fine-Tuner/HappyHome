import { Condition } from "../../announcement/api/getAnnouncement";

export interface CategoryWithConditions {
  id: string;
  name: string;
  conditions: Condition[];
}
