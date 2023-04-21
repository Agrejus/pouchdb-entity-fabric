import { faker } from "@faker-js/faker";
import { PerformanceDbDataContext } from "./performance-context";
import packageJson from '../../package.json';
import { promises, readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import semver from 'semver';
const dirTree = require("directory-tree");

const getDirectories = async (source: string) =>
    (await promises.readdir(source, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

const generateData = async (context: PerformanceDbDataContext, count: number, shouldUpsert: boolean = false) => {

    try {

        for (let dbset of context) {
            const set: any = dbset

            for (let i = 0; i < count; i++) {
                if (shouldUpsert === false) {
                    await set.add({
                        test1: `${faker.random.word()}${i}`,
                        test2: `${faker.random.word()}${i}`,
                        test3: `${faker.random.word()}${i}`,
                        test4: `${faker.random.word()}${i}`
                    });
                } else {
                    await set.upsert({
                        test1: `${faker.random.word()}${i}`,
                        test2: `${faker.random.word()}${i}`,
                        test3: `${faker.random.word()}${i}`,
                        test4: `${faker.random.word()}${i}`
                    });
                }
            }
        }

        await context.saveChanges();

        await context.optimize();
    } catch (e) {
        console.log(e);
    }
}

const generateDeltas = async () => {

    const currentVersion = packageJson.version;
    const currentVersionFolder = `v${currentVersion}`;

    const metricsPath = path.resolve(__dirname, '../metrics');
    const deltasPath = path.resolve(__dirname, '../metrics/deltas');
    const previousVersionFolders = await getDirectories(metricsPath);
    const previousVersion = previousVersionFolders.filter(w => w !== currentVersionFolder && w !== "deltas").map(w => w.replace('v', '')).sort(semver.rcompare)[0];
    const previousVersionFolder = `v${previousVersion}`;

    const currentVersionFiles = dirTree(path.resolve(metricsPath, currentVersionFolder)).children;
    const previousVersionFiles = dirTree(path.resolve(metricsPath, previousVersionFolder)).children;
    const result: {
        [fileName: string]: {
            [key: string]: {
                delta: {
                    min: number,
                    max: number,
                    average: number
                },
                [key: string]: {
                    min: number,
                    max: number,
                    average: number
                }
            }
        }
    } = {};

    for (let currentItem of currentVersionFiles) {
        const previousItem = previousVersionFiles.find((w: any) => w.name === currentItem.name);
        const previousData = readFileSync(previousItem.path, 'utf8');
        const currentData = readFileSync(currentItem.path, 'utf8');
        const previousJSON = JSON.parse(previousData) as { [key: string]: { min: number, max: number, average: number } };
        const currentJSON = JSON.parse(currentData) as { [key: string]: { min: number, max: number, average: number } };

        for (let key in currentJSON) {
            const currentLine = currentJSON[key];
            const previousLine = previousJSON[key];

            if (previousLine == null) {
                continue;
            }

            if (result[currentItem.name] == null) {
                result[currentItem.name] = {}
            }

            result[currentItem.name][key] = {
                delta: {
                    min: currentLine.min - previousLine.min,
                    max: currentLine.max - previousLine.max,
                    average: currentLine.average - previousLine.average
                },
                [currentVersionFolder]: {
                    min: currentLine.min,
                    max: currentLine.max,
                    average: currentLine.average
                }, 
                [previousVersionFolder]: {
                    min: previousLine.min,
                    max: previousLine.max,
                    average: previousLine.average
                }
            }
        }
    }

    for (let file in result) {
        const filePath = path.resolve(deltasPath, currentVersionFolder);

        if (existsSync(filePath) === false) {
            mkdirSync(filePath);
        }

        const data = result[file];
        writeFileSync(path.resolve(filePath, file), JSON.stringify(data, null, 2))
    }
}

const runTest = async (generator: () => Promise<PerformanceDbDataContext>, name: string) => {
    console.log(`Running: ${name}`);
    await destroyDatabase();

    const context = await generator();

    context.writePerformance(name);
    console.log(`Completed: ${name}`);
}

const destroyDatabase = async () => {
    const context = new PerformanceDbDataContext();
    await context.destroyDatabase();
}

const shouldAddOneEntity = async () => {
    const context = new PerformanceDbDataContext();

    await context.test1.add({ test1: faker.random.word(), test2: faker.random.word(), test3: faker.random.word(), test4: faker.random.word() });

    await context.saveChanges();

    return context;
}

const shouldUpsertOneEntity = async () => {
    const context = new PerformanceDbDataContext();

    await context.test1.upsert({ test1: faker.random.word(), test2: faker.random.word(), test3: faker.random.word(), test4: faker.random.word() });

    await context.saveChanges();

    return context;
}

const shouldAddSomeEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 50)

    await context.saveChanges();

    return context;
}

const shouldUpsertSomeEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 50, true)

    await context.saveChanges();

    return context;
}

const shouldAddManyEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 2000)

    await context.saveChanges();

    return context;
}

const shouldUpsertManyEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 2000, true)

    await context.saveChanges();

    return context;
}

const shouldRemoveOneEntity = async () => {
    const context = new PerformanceDbDataContext();

    const [item] = await context.test1.add({ test1: faker.random.word(), test2: faker.random.word(), test3: faker.random.word(), test4: faker.random.word() });

    await context.saveChanges();

    await context.test1.remove(item);

    await context.saveChanges();

    return context;
}

const shouldRemoveSomeEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 50);

    const [one, two, three] = await context.test10.all();

    await context.test10.remove(one, two, three);

    await context.saveChanges();

    return context;
}

const shouldRemoveManyEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 2000);

    await context.test10.empty();
    await context.test4.empty();
    await context.test5.empty();
    await context.test19.empty();

    await context.saveChanges();

    return context;
}

const shouldRemoveOneEntityById = async () => {
    const context = new PerformanceDbDataContext();

    const [item] = await context.test1.add({ test1: faker.random.word(), test2: faker.random.word(), test3: faker.random.word(), test4: faker.random.word() });

    await context.saveChanges();

    await context.test1.remove(item._id);

    await context.saveChanges();

    return context;
}

const shouldRemoveSomeEntitiesById = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 50);

    const [one, two, three] = await context.test10.all();

    await context.test10.remove(one._id, two._id, three._id);

    await context.saveChanges();

    return context;
}

const shouldRemoveManyEntitiesById = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 2000);

    const ten = await context.test10.all();
    const four = await context.test4.all();
    const five = await context.test5.all();
    const nineteen = await context.test19.all();

    await context.test10.remove(...ten.map(w => w._id));
    await context.test4.remove(...four.map(w => w._id));
    await context.test5.remove(...five.map(w => w._id));
    await context.test19.remove(...nineteen.map(w => w._id));

    await context.saveChanges();

    return context;
}

const shouldUpdateOneEntity = async () => {
    const context = new PerformanceDbDataContext();

    await context.test1.add({ test1: faker.random.word(), test2: faker.random.word(), test3: faker.random.word(), test4: faker.random.word() });

    await context.saveChanges();

    const item = await context.test1.first();

    item!.test1 = "Test";

    await context.saveChanges();

    return context;
}

const shouldUpdateSomeEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 50);

    const [one, two, three] = await context.test10.all();

    one.test1 = "Test One";
    two.test1 = "Test Two";
    three.test1 = "Test Three";

    await context.saveChanges();

    return context;
}

const shouldUpdateManyEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 2000);

    const ten = await context.test10.all();
    const four = await context.test4.all();
    const five = await context.test5.all();
    const nineteen = await context.test19.all();

    for (let item of ten) {
        item.test1 = faker.random.word();
        item.test2 = faker.random.word();
        item.test3 = faker.random.word();
        item.test4 = faker.random.word();
    }

    for (let item of four) {
        item.test1 = faker.random.word();
        item.test2 = faker.random.word();
        item.test3 = faker.random.word();
        item.test4 = faker.random.word();
    }

    for (let item of five) {
        item.test1 = faker.random.word();
        item.test2 = faker.random.word();
        item.test3 = faker.random.word();
        item.test4 = faker.random.word();
    }

    for (let item of nineteen) {
        item.test1 = faker.random.word();
        item.test2 = faker.random.word();
        item.test3 = faker.random.word();
        item.test4 = faker.random.word();
    }

    await context.saveChanges();

    return context;
}

const shouldGetAllSomeEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 50)

    await context.test1.all();

    return context;
}

const shouldGetAllManyEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 2000)

    await context.test1.all();

    return context;
}

const shouldGetSomeEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 50)

    const items = await context.test1.all();

    await context.test1.get(...items.map(w => w._id));

    return context;
}

const shouldGetManyEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 2000)

    const items = await context.test1.all();

    await context.test1.get(...items.map(w => w._id));

    return context;
}

const shouldAttachOneEntity = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 1)

    const items = await context.test1.all();

    const secondContext = new PerformanceDbDataContext();

    const linked = await secondContext.test1.link(...items);

    for (let item of linked) {
        item.test1 = faker.random.word();
        item.test2 = faker.random.word();
        item.test3 = faker.random.word();
        item.test4 = faker.random.word();
    }

    await secondContext.saveChanges();

    return secondContext;
}

const shouldAttachSomeEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 50)

    const items = await context.test1.all();

    const secondContext = new PerformanceDbDataContext();

    const linked = await secondContext.test1.link(...items);

    for (let item of linked) {
        item.test1 = faker.random.word();
        item.test2 = faker.random.word();
        item.test3 = faker.random.word();
        item.test4 = faker.random.word();
    }

    await secondContext.saveChanges();

    return secondContext;
}

const shouldAttachManyEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 2000)

    const items = await context.test1.all();

    const secondContext = new PerformanceDbDataContext();

    const linked = await secondContext.test1.link(...items);

    for (let item of linked) {
        item.test1 = faker.random.word();
        item.test2 = faker.random.word();
        item.test3 = faker.random.word();
        item.test4 = faker.random.word();
    }

    await secondContext.saveChanges();

    return secondContext;
}

export const run = async () => {
    try {

        await runTest(shouldAddOneEntity, "shouldAddOneEntity");
        await runTest(shouldAddSomeEntities, "shouldAddSomeEntities");
        await runTest(shouldAddManyEntities, "shouldAddManyEntities");

        await runTest(shouldUpsertOneEntity, "shouldUpsertOneEntity");
        await runTest(shouldUpsertSomeEntities, "shouldUpsertSomeEntities");
        await runTest(shouldUpsertManyEntities, "shouldUpsertManyEntities");

        await runTest(shouldRemoveOneEntity, "shouldRemoveOneEntity");
        await runTest(shouldRemoveSomeEntities, "shouldRemoveSomeEntities");
        await runTest(shouldRemoveManyEntities, "shouldRemoveManyEntities");

        await runTest(shouldRemoveOneEntityById, "shouldRemoveOneEntityById");
        await runTest(shouldRemoveSomeEntitiesById, "shouldRemoveSomeEntitiesById");
        await runTest(shouldRemoveManyEntitiesById, "shouldRemoveManyEntitiesById");

        await runTest(shouldUpdateOneEntity, "shouldUpdateOneEntity");
        await runTest(shouldUpdateSomeEntities, "shouldUpdateSomeEntities");
        await runTest(shouldUpdateManyEntities, "shouldUpdateManyEntities");

        await runTest(shouldGetAllSomeEntities, "shouldGetAllSomeEntities");
        await runTest(shouldGetAllManyEntities, "shouldGetAllManyEntities");

        await runTest(shouldGetSomeEntities, "shouldGetSomeEntities");
        await runTest(shouldGetManyEntities, "shouldGetManyEntities");

        await runTest(shouldAttachOneEntity, "shouldAttachOneEntity");
        await runTest(shouldAttachSomeEntities, "shouldAttachSomeEntities");
        await runTest(shouldAttachManyEntities, "shouldAttachManyEntities");

        await generateDeltas();

    } catch (e) {
        console.log(e)
    }

}

run(); 