import { faker } from "@faker-js/faker";
import { performance } from "perf_hooks";
import { PerformanceDbDataContext } from "./performance-context";

const generateData = async (context: PerformanceDbDataContext, count: number, dbSetCount: number = 20) => {

    try {

        let index = 0;
        for (let dbset of context) {
            const set: any = dbset

            for (let i = 0; i < count; i++) {
                await set.add({
                    test1: `${faker.random.word()}${i}`,
                    test2: `${faker.random.word()}${i}`,
                    test3: `${faker.random.word()}${i}`,
                    test4: `${faker.random.word()}${i}`
                });
            }

            index++;

            if (index >= dbSetCount) {
                break;
            }
        }

        await context.saveChanges();
    } catch (e) {
        debugger;
        console.log(e);
    }
}

export const run = async () => {
    try {

        // const cleanup = new PerformanceDbDataContext();
        // await cleanup.destroyDatabase();

        const context = new PerformanceDbDataContext();

        await generateData(context, 250, 1);
    
        await context.test1.empty();
    
        await context.saveChanges();

        const test1All = await context.test1.all();
        debugger;

    } catch (e) {
        debugger;
        console.log(e)
    }

}

run(); 