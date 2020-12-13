/**
 * Set of classes that store information about whether an action was valid
 */

import { PlayerOutcomeField } from "./outcomes.js";

 /**
  * Base class for all validities
  * @param {boolean} overall - Whether the action was valid, overall
  */
export class Validity {
    constructor(overall) {
        this.overall = overall;  // The validity of the step overall
    }
}

/**
 * Validity object to be used for simultaneous games
 * @param {boolean} overall - Whether the action was valid, overall
 * @param {(boolean[]|PlayerOutcomeField)} individual - Whether each individual action taken by a player was valid
 */
export class SimValidity extends Validity {
    constructor(overall, individual) {
        super(overall);

        this.individual = individual;
    }
}

/**
 * Validity object to be used for sequential games
 * See Validity class for constructor documentation
 */
export class SeqValidity extends Validity{}

/**
 * Validity object to be used for real time games
 * See Validity class for constructor documentation
 */
export class RealTimeValidity extends Validity {}