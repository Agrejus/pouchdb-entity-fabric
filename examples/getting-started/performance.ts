import { faker } from "@faker-js/faker";
import { performance } from "perf_hooks";
import { DataContext } from "../../src/DataContext";
import { IDbRecord } from "../../src/typings";

enum DocumentTypes {
    Test1 = "Test1",
    Test2 = "Test2",
    Test3 = "Test3",
    Test4 = "Test4",
    Test5 = "Test5",
    Test6 = "Test6",
    Test7 = "Test7",
    Test8 = "Test8",
    Test9 = "Test9",
    Test10 = "Test10",
    Test11 = "Test11",
    Test12 = "Test12",
    Test13 = "Test13",
    Test14 = "Test14",
    Test15 = "Test15",
    Test16 = "Test16",
    Test17 = "Test17",
    Test18 = "Test18",
    Test19 = "Test19",
    Test20 = "Test20"
}

interface ITest1 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest2 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest3 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest4 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest5 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest6 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest7 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest8 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest9 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest10 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest11 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest12 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest13 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest14 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest15 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest16 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest17 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest18 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest19 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

interface ITest20 extends IDbRecord<DocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

class PouchDbDataContext extends DataContext<DocumentTypes> {

    constructor() {
        super('test-db');
    }

    async empty() {
        for (let dbset of this) {
            await dbset.empty();
        }

        await this.saveChanges();
    }

    async allDocs() {
        return await this.doWork(w => w.allDocs());
    }

    async destroy() {
        await this.doWork(w => w.destroy());
    }

    test1 = this.createDbSet<ITest1>(DocumentTypes.Test1);
    test2 = this.createDbSet<ITest2>(DocumentTypes.Test2);
    test3 = this.createDbSet<ITest3>(DocumentTypes.Test3);
    test4 = this.createDbSet<ITest4>(DocumentTypes.Test4);
    test5 = this.createDbSet<ITest5>(DocumentTypes.Test5);
    test6 = this.createDbSet<ITest6>(DocumentTypes.Test6);
    test7 = this.createDbSet<ITest7>(DocumentTypes.Test7);
    test8 = this.createDbSet<ITest8>(DocumentTypes.Test8);
    test9 = this.createDbSet<ITest9>(DocumentTypes.Test9);
    test10 = this.createDbSet<ITest10>(DocumentTypes.Test10);
    test12 = this.createDbSet<ITest12>(DocumentTypes.Test12);
    test13 = this.createDbSet<ITest13>(DocumentTypes.Test13);
    test14 = this.createDbSet<ITest14>(DocumentTypes.Test14);
    test15 = this.createDbSet<ITest15>(DocumentTypes.Test15);
    test16 = this.createDbSet<ITest16>(DocumentTypes.Test16);
    test17 = this.createDbSet<ITest17>(DocumentTypes.Test17);
    test18 = this.createDbSet<ITest18>(DocumentTypes.Test18);
    test19 = this.createDbSet<ITest19>(DocumentTypes.Test19);
    test20 = this.createDbSet<ITest20>(DocumentTypes.Test20);
}

const generateData = async (context: PouchDbDataContext) => {

    try {

        for(let dbset of context) {
            const set : any = dbset

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
        // how much faster is this vs having an index on DocumentType?

        // Auto add index?
        const tearDown = new PouchDbDataContext();
        await tearDown.destroy();

        const context = new PouchDbDataContext();

        await generateData(context);

        const s = performance.now();

        // before index, all = 135ms
        let all = await context.test1.all();

        const e = performance.now();
        console.log(e - s);

    } catch (e) {
        debugger;
        console.log(e)
    }

}

run();