import { faker } from "@faker-js/faker";
import { PerformanceDbDataContext } from "./performance-context";

const generateData = async (context: PerformanceDbDataContext, count: number) => {

    try {

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
        }

        await context.saveChanges();

        await context.generateDocumentTypeIndex();
    } catch (e) {
        debugger;
        console.log(e);
    }

}

const runTest = async (generator: () => Promise<PerformanceDbDataContext>, name:string) => {
    await destroyDatabase();
    
    const context = await generator();

    context.writePerformance(name)
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

const shouldAddSomeEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 5)

    await context.saveChanges();

    return context;
}

const shouldAddManyEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 2000)

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

    await generateData(context, 50);

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

    await generateData(context, 50);

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

    item.test1 = "Test";

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

    await generateData(context, 50);

    const ten = await context.test10.all();
    const four = await context.test4.all();
    const five = await context.test5.all();
    const nineteen = await context.test19.all();

    for(let item of ten) {
        item.test1 = faker.random.word();
        item.test2 = faker.random.word();
        item.test3 = faker.random.word();
        item.test4 = faker.random.word();
    }

    for(let item of four) {
        item.test1 = faker.random.word();
        item.test2 = faker.random.word();
        item.test3 = faker.random.word();
        item.test4 = faker.random.word();
    }

    for(let item of five) {
        item.test1 = faker.random.word();
        item.test2 = faker.random.word();
        item.test3 = faker.random.word();
        item.test4 = faker.random.word();
    }

    for(let item of nineteen) {
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

const shouldAttachSomeEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 10)

    const items = await context.test1.all();

    const secondContext = new PerformanceDbDataContext();    

    secondContext.test1.attach(...items);

    for(let item of items) {
        item.test1 = faker.random.word();
        item.test2 = faker.random.word();
        item.test3 = faker.random.word();
        item.test4 = faker.random.word();
    }

    await secondContext.saveChanges();

    return context;
}

const shouldAttachManyEntities = async () => {
    const context = new PerformanceDbDataContext();

    await generateData(context, 1000)

    const items = await context.test1.all();

    const secondContext = new PerformanceDbDataContext();    

    secondContext.test1.attach(...items);

    for(let item of items) {
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

        await runTest(shouldAttachSomeEntities, "shouldAttachSomeEntities");
        await runTest(shouldAttachManyEntities, "shouldAttachManyEntities");

    } catch (e) {
        debugger;
        console.log(e)
    }

}

run(); 