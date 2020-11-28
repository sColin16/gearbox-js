/**
 * Queue implementation that simply wraps arrays
 * @param {Array} items the initial items in the queue
 */
export class Queue {
    constructor(items = []) {
        this.items = items;
    }

    /**
     * Adds the given object to the queue 
     * @param {*} item The object to add to the queue
     */
    enqueue(item) {
        this.items.push(item);
    }

    /**
     * Removes and returns the next item from the queue
     */
    dequeue() {
        return this.items.shift();
    }

    /**
     * Returns the number of objects in the queue
     */
    size() {
        return this.items.length;
    }

    /**
     * Returns whether or not the queue is empty
     */
    empty() {
        return this.items.length == 0;
    }
}

/**
 * Simple helper function to simulate delays
 * @param {number} ms Number of silliseconds to delay
 */
export async function delay(ms) {
    return new Promise(function(resolve, reject) {
        setTimeout(resolve, ms);
    });
}