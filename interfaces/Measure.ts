/**
 * Measurement of a single request
 *
 * Describes timestamp, duration and if it was sucessful
 */
export interface Measure {
  timestamp: number;
  duration: number;
  successful: boolean;
}
