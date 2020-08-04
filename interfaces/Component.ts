import { Status } from "../Enums/Status";

/**
 * A minimal component represetation
 */
export default interface Component {
  id: Number;
  name: string;
  description: string;
  link: string;
  status: Status;
}
