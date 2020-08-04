require("dotenv").config();
import Component from "./interfaces/Component";
import Util from "./util";
import Incident from "./interfaces/Incident";
import { Status } from "./Enums/Status";
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
  currentIncidents: Incident[];

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
   */
  async heartbeat() {
    try {
      console.log("Hi");
    } catch (e) {
      console.log(e);
    }
    this.reportIncident(this.components[0]);
    setTimeout(() => this.heartbeat(), 5000);
  }

  /**
   * Checks if there is an active incident
   * @returns {@link Status}
   */
  checkServiceOnIncidents(component: Component): Status {
    return Status.OPERATIONAL;
  }
  /**
   * Updates the Components
   */
  updateComponents() {}

  /**
   * Get all components
   */
  getAllComponents() {}

  /**
   * Reports an incident
   */
  reportIncident(affected_component: Component) {
    var incident: Incident = {
      name: "Nicht erreichbar",
      message:
        "Das Problem wird bereits untersucht. Wir halten euch hier auf dem Laufendem.",
      status: "Investigating",
      visible: true,
      notify: false,
      component_id: 1,
      component_status: "Major Outage",
    };

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
