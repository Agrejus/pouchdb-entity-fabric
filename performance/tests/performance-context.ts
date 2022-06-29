import { performance } from "perf_hooks";
import { DataContext } from "../../src/DataContext";
import { DbSet } from "../../src/DbSet";
import { DataContextOptions, EntityIdKeys, IBulkDocsResponse, IDbRecord, IDbRecordBase, IDbSet } from "../../src/typings";
import { max, mean, min, uniqBy } from 'lodash';
import * as fs from 'fs';
import * as path from 'path'
import packageJson from '../../package.json';

export enum PerformanceDocumentTypes {
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

export interface ITest1 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest2 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest3 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest4 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest5 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest6 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest7 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest8 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest9 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest10 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest11 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest12 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest13 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest14 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest15 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest16 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest17 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest18 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest19 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

export interface ITest20 extends IDbRecord<PerformanceDocumentTypes> {
    test1: string;
    test2: string;
    test3: string;
    test4: string;
}

const overrideWithPerformance = (instance: any, propertiesToIgnore: string[], propertyTimesToIgnore: string[], isDbSet: boolean, ...prototypes: any[]) => {
    const keys = [...prototypes.map(w => Object.getOwnPropertyNames(w))].flat().filter(w => w.startsWith("_") === false && propertiesToIgnore.includes(w) === false);

    if (!isDbSet) {
        instance.metrics = [];

        instance.writePerformance = (name: string) => {

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

                if (propertyTimesToIgnore.includes(item.name) === false) {
                    result[item.name]['times'] = times;
                }
            }
            const fileNameAndPath = `./performance/metrics/v${packageJson.version}/performance-${name}.json`;

            const dirname = path.dirname(fileNameAndPath);

            if (fs.existsSync(dirname) === false) {
                fs.mkdirSync(dirname);
            }

            fs.writeFileSync(fileNameAndPath, JSON.stringify(result, null, 2))
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

export class PerformanceDbDataContext extends DataContext<PerformanceDocumentTypes> {

    constructor(options?: DataContextOptions) {
        super('test-db1', options);
        const propertiesToIgnore = [
            'insertEntity',
            'getContext',
            'getAllData',
            'updateEntity',
            'removeEntity',
            'removeEntityById',
            'getEntity',
            'addEntityWithoutId',
            'createDbSet',
            'DataContext',
            'constructor',
            'PerformanceDbDataContext'
        ]

        overrideWithPerformance(this, propertiesToIgnore, ['add', 'remove'], false, DataContext.prototype, PerformanceDbDataContext.prototype);
    }

    protected async bulkDocs(entities: IDbRecordBase[]) {
        return super.bulkDocs(entities);
    }

    writePerformance(name: string) { }

    async getIndexes() {
        return await this.doWork(w => w.getIndexes());
    }

    protected createPerformanceDbSet<TEntity extends IDbRecord<PerformanceDocumentTypes>>(documentType: PerformanceDocumentTypes) {
        const dbSet = this.dbset<TEntity>(documentType).create()

        const propertiesToIgnore = [
            'DbSet',
            'constructor',
            'IdKeys',
            'DocumentType'
        ];

        overrideWithPerformance(dbSet, propertiesToIgnore, [], true, DbSet.prototype);

        return dbSet;
    }

    test1 = this.createPerformanceDbSet<ITest1>(PerformanceDocumentTypes.Test1);
    test2 = this.createPerformanceDbSet<ITest2>(PerformanceDocumentTypes.Test2);
    test3 = this.createPerformanceDbSet<ITest3>(PerformanceDocumentTypes.Test3);
    test4 = this.createPerformanceDbSet<ITest4>(PerformanceDocumentTypes.Test4);
    test5 = this.createPerformanceDbSet<ITest5>(PerformanceDocumentTypes.Test5);
    test6 = this.createPerformanceDbSet<ITest6>(PerformanceDocumentTypes.Test6);
    test7 = this.createPerformanceDbSet<ITest7>(PerformanceDocumentTypes.Test7);
    test8 = this.createPerformanceDbSet<ITest8>(PerformanceDocumentTypes.Test8);
    test9 = this.createPerformanceDbSet<ITest9>(PerformanceDocumentTypes.Test9);
    test10 = this.createPerformanceDbSet<ITest10>(PerformanceDocumentTypes.Test10);
    test11 = this.createPerformanceDbSet<ITest11>(PerformanceDocumentTypes.Test11);
    test12 = this.createPerformanceDbSet<ITest12>(PerformanceDocumentTypes.Test12);
    test13 = this.createPerformanceDbSet<ITest13>(PerformanceDocumentTypes.Test13);
    test14 = this.createPerformanceDbSet<ITest14>(PerformanceDocumentTypes.Test14);
    test15 = this.createPerformanceDbSet<ITest15>(PerformanceDocumentTypes.Test15);
    test16 = this.createPerformanceDbSet<ITest16>(PerformanceDocumentTypes.Test16);
    test17 = this.createPerformanceDbSet<ITest17>(PerformanceDocumentTypes.Test17);
    test18 = this.createPerformanceDbSet<ITest18>(PerformanceDocumentTypes.Test18);
    test19 = this.createPerformanceDbSet<ITest19>(PerformanceDocumentTypes.Test19);
    test20 = this.createPerformanceDbSet<ITest20>(PerformanceDocumentTypes.Test20);
}