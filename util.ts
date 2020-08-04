import Axios from "axios";

import axios from "axios";
import Component from "./interfaces/Component";
/**
 * Useful functions for CachetJS
 */
export default class Util {
  /**
   * Returns a new instance of Util
   */
  constructor() {}
  /**
   * Get all components
   */
  async getAllComponents(baseurl): Promise<Component[]> {
    const response = await axios.get(
      `${baseurl}/api/v1/components?sort=status&order=desc`
    );
    let components: Component[] = response.data["data"];
    return components;
  }
}
