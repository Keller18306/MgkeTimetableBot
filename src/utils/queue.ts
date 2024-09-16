export class KeyedQueue {
    private queues: Map<string, Array<() => Promise<any>>>;

    constructor() {
        this.queues = new Map();
    }

    async execute<T>(key: string, task: () => Promise<T>): Promise<T> {
        const queue = this.queues.get(key) || [];
        this.queues.set(key, queue);

        return new Promise((resolve, reject) => {
            const runTask = async () => {
                try {
                    const result = await task();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    // Удаляем задачу из очереди после выполнения
                    queue.shift();
                    if (queue.length > 0) {
                        queue[0]();
                    } else {
                        this.queues.delete(key);
                    }
                }
            };

            // Если очередь пуста, можем сразу выполнить задачу
            if (queue.length === 0) {
                queue.push(runTask);
                runTask();
            } else {
                queue.push(runTask);
            }
        });
    }
}