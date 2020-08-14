require('dotenv').config();
import Component from './interfaces/Component';
var snmp = require('snmp-node');

/**
 * SNMP Reader Tool to monitor system information
 */
export class SNMP {
  constructor() {}

  /**
   * Get system monitoring information
   */
  getMonitoringInformation(component: Component) {
    let host = component.link.replace('https://', '');
    const communityString = process.env.COMMUNITYSTRING;
    host = 'status.fffutu.re';
    let session = new snmp.Session({
      host: host,
      port: 161,
      community: communityString,
    });
    session.get({ oid: [1, 3, 6, 1, 4, 1, 42, 1, 0] }, function (error: any, varbinds: any) {
      if (error) {
        console.log('Fail :(');
      } else {
        console.log(varbinds.valueRaw);
      }
    });
  }
}
