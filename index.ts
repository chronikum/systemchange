require("dotenv").config();
import Component from "./interfaces/Component";
import Util from "./util";
import Incident from "./interfaces/Incident";
import { Status } from "./Enums/Status";
import axios from "axios";
import { stat } from "fs";
import { SNMP } from "./snmp";
var CachetAPI = require("cachet-api");

export default class CachetJS {
  /**
   * The Cachet Client
   */
  cachet = null;
  /**
   * Available components
   */
  components: Component[] = [];
  /**
   * Utils for CachetJS
   */
  utils = new Util();
  /**
   * Current Incidents to not update component all the time if it is affected
   */
  currentAffectedComponents: Component[] = [];
  /**
   * Local testing
   */
  localTestingMode = false;
  /**
   * SNMP Monitoring
   */
  snmp: SNMP = new SNMP();

  /**
   * Constructs a new instance of {@link CachetJS}
   * @description Initiates Client
   */
  constructor() {
    this.cachet = new CachetAPI({
      // Base URL of your installed Cachet status page
      url: process.env.BASEURL,
      // Cachet API key (provided within the admin dashboard)
      apiKey: process.env.TOKEN,
    });
    this.setup();
  }

  /**
   * Loads the components which will be checked on and starts the heartbeat
   */
  async setup() {
    this.components = await this.utils.getAllComponents(process.env.BASEURL);
    this.startHearbeat();
  }
  /**
   * Start Heartbeat and prepare stuff
   *
   * Keeps the app running alive and does all the work
   */
  startHearbeat() {
    this.heartbeat();
  }

  /**
   * Heartbeat
   *
   * Every 30 Seconds
   */
  async heartbeat() {
    if (!this.localTestingMode) {
      try {
        this.components = await this.utils.getAllComponents(
          process.env.BASEURL
        );
        this.components.forEach(async (component) => {
          if (component.status == Status.OPERATIONAL) {
            // Status in Database operational?
            const status = await this.checkServiceOnIncidents(component); // Real state
            if (status != Status.OPERATIONAL) {
              // Check if service needs service
              // Check if real state is operational
              console.log("ERROR!");
              this.reportIncident(component, status);
            } else {
              console.log("Operational!");
            }
          }
        });
      } catch (e) {
        console.log("Ein Fehler ist aufgetreten!");
        console.log(e);
      }
    }
    // this.snmp.getMonitoringInformation(this.components[0]);
    setTimeout(() => this.heartbeat(), 60000);
  }

  /*
   * Checks if services is responding
   */
  async getResponseFromComponent(component: Component): Promise<Status> {
    const response = await axios({
      url: component.link,
      timeout: 10000,
      method: "get",
    }).catch((e) => {
      return null;
    });
    if (response && response.status) {
      switch (response.status) {
        case 200:
          return Status.OPERATIONAL;
        case 503:
          return Status.PARTIAL_OUTAGE;
        case 500:
          console.log("ERROR");
          return Status.MAJOR_OUTAGE;
      }
    } else {
      console.log("ERROR");
      return Status.MAJOR_OUTAGE;
    }
  }
  /**
   * Checks if there is an active incident
   * @returns {@link Status}
   */
  async checkServiceOnIncidents(component: Component): Promise<Status> {
    console.log("Checking service");
    const status = await this.getResponseFromComponent(component);
    if (status === Status.OPERATIONAL) {
      return Status.OPERATIONAL;
    } else {
      const checkStatusAgain = await this.getResponseFromComponent(component);
      return checkStatusAgain;
    }
  }

  /**
   * Reports an incident
   */
  reportIncident(affected_component: Component, status: Status) {
    var incident: Incident = {
      name: status,
      message:
        "Das Problem wird bereits untersucht. Wir halten euch hier auf dem Laufendem.",
      status: "Investigating",
      visible: true,
      notify: false,
      component_id: affected_component.id,
      component_status: status,
    };

    this.currentAffectedComponents.push(affected_component);

    this.cachet
      .reportIncident(incident)
      .then(function (response) {
        // Log API response
        console.log("New incident reported at " + response.data.created_at);
      })
      .catch(function (err) {
        // Log errors to console
        console.log("Fatal Error", err);
      });
  }
}

new CachetJS();
