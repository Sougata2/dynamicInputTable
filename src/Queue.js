class Queue {
    queue
    constructor() {
        this.queue = []
    }

    poll() {
        return this.queue.shift()
    }

    add(element) {
        this.queue.push(element)
    }

    isEmpty() {
        return this.queue.length === 0;
    }
}

export default Queue;