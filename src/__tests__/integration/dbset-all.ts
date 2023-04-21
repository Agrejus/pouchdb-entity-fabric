import { DbContextFactory, PouchDbDataContext } from "../../../test-helpers/context";

describe('DbSet All Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should get correct number of entities from all', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.cars.add({
            make: "test",
            manufactureDate: new Date(),
            model: "test",
            year: 2000
        });

        await context.saveChanges();

        const all = await context.contacts.all();

        expect(all.length).toBe(1);
    });
});