import { Status } from "../Enums/Status";

/**
 * A minimal component represetation
 */
export default interface Component {
  id: Number;
  name: String;
  description: String;
  link: String;
  status: Status;
}
