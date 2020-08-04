import { Status } from "../Enums/Status";

export default interface Incident {
  name: String;
  message: String;
  status: String;
  visible: Boolean;
  notify: Boolean;
  component_id: Number;
  component_status: String;
  updated_at?: Date;
}
