import { randomInt } from "crypto";
import { BotInput } from "../src/services/bots/input";

const main = async () => {
    const input = new BotInput(10 * 1e3);
    const peerId: string = 'test';

    for (let i = 0; i < 100; i++) {
        (async () => {
            try {
                const promise = input.create(peerId);

                //payload, отправка сообщения
                const message = new Promise((res, rej) => {
                    setTimeout(res, randomInt(0, 1000));
                    setTimeout(rej, randomInt(0, 1000));
                });

                const [result] = await Promise.all([promise, message]);
            } catch (e) {
                console.log('CATCHED SUCCESS')
            }
        })();
    }

    //wait to timeout for 10 sec

    console.log('PASSED')
    // input.cancel(peerId);
}

main();