import Axios from 'axios';

import axios from 'axios';
import Component from './interfaces/Component';
import { Status } from './Enums/Status';
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
  async getAllComponents(baseurl: String): Promise<Component[]> {
    const response = await axios.get(`${baseurl}/api/v1/components?sort=status&order=desc`);
    let components: Component[] = [];
    response.data['data'].forEach((rawComponent: any) => {
      var status = Status.MAJOR_OUTAGE;
      switch (rawComponent['status']) {
        case 1:
          status = Status.OPERATIONAL;
          break;
        case 2:
          status = Status.PERFORMANCE;
          break;
        case 3:
          status = Status.PARTIAL_OUTAGE;
          break;
        case 4:
          status = Status.MAJOR_OUTAGE;
          break;
      }
      let component: Component = {
        status: status,
        id: rawComponent['id'],
        name: rawComponent['name'],
        description: rawComponent['description'],
        link: rawComponent['link'],
      };
      components.push(component);
    });
    return components;
  }
}
