import { DbContextFactory, PouchDbDataContext } from "./shared/context";

describe('DbSet markDirty Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should mark entity as dirty and save', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);

        const all = await context.notes.all();

        expect(all.length).toBe(0);

        const [one] = await context.notes.add({
            contents: "some contents",
            createdDate: new Date(),
            userId: "some user"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);
        const found = await context.notes.first();

        if (found == null) {
            expect(true).toBe(false);
            return
        }

        const [dirty] = await context.notes.markDirty(found);

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        expect(dirty._rev).not.toEqual(one._rev)
    });
});