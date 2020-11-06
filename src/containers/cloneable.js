/**
 * Defines the Cloneable object, a base class that allows any object that inherits from it to be cloned
 */

import { cloneDeep } from 'https://cdn.skypack.dev/lodash-es'; 

/**
 * Utility class that other classes can inherit from to make themselves clonable
 * Sub-classes can also override the clone method if needed
 */
export class Cloneable {
    /**
     * @returns A deep clone of this instance
     */
    clone() {
        return cloneDeep(this);
    }
}