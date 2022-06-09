import { faker } from "@faker-js/faker";
import { PerformanceDbDataContext } from "./performance-context";

const generateData = async (context: PerformanceDbDataContext) => {

    try {

        for (let dbset of context) {
            const set: any = dbset

            for (let i = 0; i < 1000; i++) {
                await set.add({
                    test1: `${faker.random.word()}${i}`,
                    test2: `${faker.random.word()}${i}`,
                    test3: `${faker.random.word()}${i}`,
                    test4: `${faker.random.word()}${i}`
                });
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

        /* Performance TESTS
        Add One
        Add Many
        Remove One By Reference
        Remove Many By Reference
        Remove One By Id
        Remove Many Bi Id
        Update One
        Update Many
        Get All - Few Docs
        Get All - Many Docs
        Attach One
        Attach Mnay
        Detach One
        Detach Many
        Get One By Id
        Get Many By Id

        Many Definition
        20, 200, 2000

        */


        // Auto add index?
        const tearDown = new PerformanceDbDataContext();
        await tearDown.destroyDatabase();

        const context = new PerformanceDbDataContext();

        await generateData(context);

        // this must happen after data generation
        await context.createDocumentTypeIndex();

        // before index, all = 135ms
        let [first, second, third, ...rest] = await context.test1.all();
        await context.allDocs();

        first.test1 = "Changed";
        await context.test1.remove(second);
        await context.test1.remove(third._id);

        await context.test1.add({
            test1: "test1",
            test2: "test2",
            test3: "test3",
            test4: "test4"
        })

        await context.saveChanges();

        await context.test1.all();

        context.writePerformance();

    } catch (e) {
        debugger;
        console.log(e)
    }

}

run(); 