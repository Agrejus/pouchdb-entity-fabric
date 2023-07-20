import { shouldFilterEntitiesWithDefaults, shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery } from "./shared/common-tests";
import { DbContextFactory, PouchDbDataContext } from "./shared/context";

describe('DbSet Filter Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should filter entities', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
        const [first] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "John",
            lastName: "Doe",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        const filtered = await context.contacts.filter(w => w.firstName === "James");

        expect(filtered.length).toBe(1);

        const doesMatch = context.contacts.isMatch(filtered[0], first);
        expect(doesMatch).toBe(true);
    });

    it('should filter entities with no defaults', async () => {

        await shouldFilterEntitiesWithDefaults(
            () => contextFactory.createContextWithParams("", "my-db0"),
            (dbSet, selector) => dbSet.filter(w => selector(w)),
            w => expect(w.length).toBe(1))
    });

    it('should filter entities with defaults', async () => {

        await shouldFilterEntitiesWithDefaults(
            () => contextFactory.createContextWithParams("CouchDB", "my-db"),
            (dbSet, selector) => dbSet.filter(w => selector(w)),
            w => expect(w.length).toBe(1))
    });

    it('should filter entities and not find result when base filter does not match - with default', async () => {

        await shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery(
            () => contextFactory.createContextWithParams("CouchDB", "my-db1"),
            () => contextFactory.createContextWithParams("", "my-db1"),
            (dbSet, selector) => dbSet.filter(w => selector(w)),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(0),
            w => expect(w.length).toBe(1))
    });

    it('should filter entities and not find result when base filter does not match - with no default', async () => {

        await shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery(
            () => contextFactory.createContextWithParams("", "my-db2"),
            () => contextFactory.createContextWithParams("CouchDB", "my-db2"),
            (dbSet, selector) => dbSet.filter(w => selector(w)),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(0),
            w => expect(w.length).toBe(1))
    });
});