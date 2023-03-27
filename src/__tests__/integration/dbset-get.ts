import { DbContextFactory, PouchDbDataContext } from "../../../test-helpers/context";

describe('DbSet Get Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should get correct number of entities from get', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
        const [one, two] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "Other",
            lastName: "DeMeuse",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        const all = await context.contacts.get(one._id, two._id);

        expect(all.length).toBe(2);
    });

    it('should throw when id is not found on get', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
        const [one, two] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "Other",
            lastName: "DeMeuse",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        try {
            await context.contacts.get("tester");
            expect(false).toBe(true)
        } catch (e) {
            expect(e).toBeDefined()
        }
    });
});