import Component from './Component';
import { Measure } from './Measure';

/**
 * Describes Measurements for a single Component.
 * Describes Measure on a longer period of time
 */
export interface Measuremnts {
  component: Component;
  items: Measure[];
}
