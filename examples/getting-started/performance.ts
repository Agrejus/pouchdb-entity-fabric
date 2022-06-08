import { faker } from "@faker-js/faker";
import { performance } from "perf_hooks";
import { DataContext } from "../../src/DataContext";
import { DbSet } from "../../src/DbSet";
import { EntityIdKeys, IDbRecord, IDbSet } from "../../src/typings";
import { max, mean, min, uniqBy } from 'lodash';
import * as fs from 'fs';
import packageJson from '../../package.json';

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

const overrideWithPerformance = (instance: any, propertiesToIgnore: string[], isDbSet: boolean, ...prototypes: any[]) => {
    const keys = [...prototypes.map(w => Object.getOwnPropertyNames(w))].flat().filter(w => w.startsWith("_") === false && propertiesToIgnore.includes(w) === false);

    if (!isDbSet) {
        instance.metrics = [];

        instance.getPerformance = () => {

            const result = {};

            const metric = uniqBy(instance.metrics, (w: any) => w.name)

            for (let item of metric) {

                const times: number[] = instance.metrics.filter((w: any) => w.name === item.name).map((w: any) => w.time);
                const minVaue = min(times);
                const maxValue = max(times);
                const averageValue = mean(times);

                result[item.name] = {
                    min: minVaue,
                    max: maxValue,
                    average: averageValue
                }
            }

            return result;
        }
    }

    for (let key of keys) {

        const fn = instance[key].bind(instance);

        instance[key] = async (...args: any[]) => {
            const s = performance.now();
            const result = await fn(...args);
            const e = performance.now();
            if (isDbSet) {
                instance._context.metrics.push({ name: key, time: e - s })
            } else {
                instance.metrics.push({ name: key, time: e - s })
            }

            return result;
        }
    }
}

class PerformanceDbDataContext extends DataContext<DocumentTypes> {

    constructor() {
        super('test-db');
        const propertiesToIgnore = [
            'insertEntity',
            'getContext',
            'getAllData',
            'updateEntity',
            'bulkDocs',
            'removeEntity',
            'removeEntityById',
            'getEntity',
            'addEntityWithoutId',
            'createDbSet',
            'DataContext',
            'constructor',
            'PerformanceDbDataContext'
        ]

        overrideWithPerformance(this, propertiesToIgnore, false, DataContext.prototype, PerformanceDbDataContext.prototype);
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
        await this.doWork(w => w.destroy(), false);
    }

    async createDocumentTypeIndex() {
        await this.doWork(w => w.createIndex({
            index: {
                fields: ["DocumentType"],
                name: 'document-type-index',
                ddoc: "document-type-index"
            },
        }));
    }

    async getIndexes() {
        return await this.doWork(w => w.getIndexes());
    }

    protected createPerformanceDbSet<TEntity extends IDbRecord<DocumentTypes>, TExtraExclusions extends (keyof TEntity) | void = void>(documentType: DocumentTypes, ...idKeys: EntityIdKeys<DocumentTypes, TEntity>): IDbSet<DocumentTypes, TEntity, TExtraExclusions> {
        const dbSet = this.createDbSet<TEntity, TExtraExclusions>(documentType, ...idKeys)

        const propertiesToIgnore = [
            'DbSet',
            'constructor',
            'IdKeys',
            'DocumentType'
        ];

        overrideWithPerformance(dbSet, propertiesToIgnore, true, DbSet.prototype);

        return dbSet;
    }

    test1 = this.createPerformanceDbSet<ITest1>(DocumentTypes.Test1);
    test2 = this.createPerformanceDbSet<ITest2>(DocumentTypes.Test2);
    test3 = this.createPerformanceDbSet<ITest3>(DocumentTypes.Test3);
    test4 = this.createPerformanceDbSet<ITest4>(DocumentTypes.Test4);
    test5 = this.createPerformanceDbSet<ITest5>(DocumentTypes.Test5);
    test6 = this.createPerformanceDbSet<ITest6>(DocumentTypes.Test6);
    test7 = this.createPerformanceDbSet<ITest7>(DocumentTypes.Test7);
    test8 = this.createPerformanceDbSet<ITest8>(DocumentTypes.Test8);
    test9 = this.createPerformanceDbSet<ITest9>(DocumentTypes.Test9);
    test10 = this.createPerformanceDbSet<ITest10>(DocumentTypes.Test10);
    test12 = this.createPerformanceDbSet<ITest12>(DocumentTypes.Test12);
    test13 = this.createPerformanceDbSet<ITest13>(DocumentTypes.Test13);
    test14 = this.createPerformanceDbSet<ITest14>(DocumentTypes.Test14);
    test15 = this.createPerformanceDbSet<ITest15>(DocumentTypes.Test15);
    test16 = this.createPerformanceDbSet<ITest16>(DocumentTypes.Test16);
    test17 = this.createPerformanceDbSet<ITest17>(DocumentTypes.Test17);
    test18 = this.createPerformanceDbSet<ITest18>(DocumentTypes.Test18);
    test19 = this.createPerformanceDbSet<ITest19>(DocumentTypes.Test19);
    test20 = this.createPerformanceDbSet<ITest20>(DocumentTypes.Test20);
}

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
        // how much faster is this vs having an index on DocumentType?

        // Auto add index?
        const tearDown = new PerformanceDbDataContext();
        await tearDown.destroy();

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

        const metricContext = context as any;

        const allMetrics = metricContext.getPerformance();

        fs.writeFileSync(`./metrics/performance-${packageJson.version}.json`, JSON.stringify(allMetrics, null, 2))

    } catch (e) {
        debugger;
        console.log(e)
    }

}

run(); 