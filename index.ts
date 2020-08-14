/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();
import Component from './interfaces/Component';
import Util from './util';
import Incident from './interfaces/Incident';
import { Status } from './Enums/Status';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { performance } from 'perf_hooks';
import { stat } from 'fs';
import { SNMP } from './snmp';
const CachetAPI = require('cachet-api');

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
   * Axios client
   */
  axiosInstance: any;

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
  async setup(): Promise<boolean> {
    this.configurateAxiosInstance();
    this.components = await this.utils.getAllComponents(process.env.BASEURL);
    if (this.components && this.components.length > 0) {
      this.startHearbeat();
      return true;
    } else {
      throw 'Error: Did not get any components. Please check your environment and your access token.';
    }
  }

  /**
   * Configure Axios Instance for timing
   */
  configurateAxiosInstance() {
    this.axiosInstance = axios.create();

    this.axiosInstance.interceptors.request.use(
      (config: { headers: { [x: string]: [number, number] } }) => {
        config.headers['request-startTime'] = process.hrtime();
        return config;
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response: {
        config: { headers: { [x: string]: any } };
        headers: { [x: string]: number };
      }) => {
        const start = response.config.headers['request-startTime'];
        const end = process.hrtime(start);
        const milliseconds = Math.round(end[0] * 1000 + end[1] / 1000000);
        response.headers['request-duration'] = milliseconds;
        return response;
      }
    );
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
        this.components = await this.utils.getAllComponents(process.env.BASEURL);
        this.components.forEach(async (component) => {
          if (component.status == Status.OPERATIONAL) {
            // Status in Database operational?
            const status = await this.checkServiceOnIncidents(component); // Real state
            if (status != Status.OPERATIONAL) {
              if (status !== Status.UNKNOWN) {
                console.log(`Detected outage at ${component.name}. Reporting it now.`);
                // this.reportIncident(component, status);
              } else {
                console.log('Unknown state. Please check your internet connnection');
              }
            } else {
              console.log('Operational!');
            }
          }
        });
      } catch (e) {
        console.log('Ein Fehler ist aufgetreten!');
        console.log(e);
      }
    }
    setTimeout(() => this.heartbeat(), 60000);
  }

  /*
   * Checks if services is responding
   */
  async getResponseFromComponent(component: Component, timeout: number): Promise<Status> {
    const response = await this.axiosInstance({
      url: component.link,
      timeout: timeout,
      method: 'get',
    }).catch((e: AxiosError) => {
      return null;
    });

    if (response && response.status) {
      const responseTime = response.headers['request-duration'];
      console.log(`Response from ${component.name} received after: ${responseTime}`);
      switch (response.status) {
        case 200:
          return Status.OPERATIONAL;
        case 503:
          return Status.PARTIAL_OUTAGE;
        case 500:
          console.log('ERROR');
          return Status.MAJOR_OUTAGE;
      }
    } else {
      console.log('ERROR');
      return Status.MAJOR_OUTAGE;
    }

    return Status.UNKNOWN;
  }
  /**
   * Checks if there is an active incident
   * @returns {@link Status}
   */
  async checkServiceOnIncidents(component: Component): Promise<Status> {
    console.log('Checking service');
    const status = await this.getResponseFromComponent(component, 10000);
    if (status === Status.OPERATIONAL) {
      return Status.OPERATIONAL;
    } else {
      const checkStatusAgain = await this.getResponseFromComponent(component, 30000);
      return checkStatusAgain;
    }
  }

  /**
   * Reports an incident
   */
  reportIncident(affected_component: Component, status: Status): Boolean {
    const incident: Incident = {
      name: status,
      message: 'Das Problem wird bereits untersucht. Wir halten euch hier auf dem Laufendem.',
      status: 'Investigating',
      visible: true,
      notify: false,
      component_id: affected_component.id,
      component_status: status,
    };

    this.currentAffectedComponents.push(affected_component);

    this.cachet
      .reportIncident(incident)
      .then(function (response: { data: { created_at: string } }) {
        // Log API response
        console.log('New incident reported at ' + response.data.created_at);
      })
      .catch(function (err: any) {
        // Log errors to console
        console.log('Fatal Error', err);
      });
    return true;
  }
}

new CachetJS();
