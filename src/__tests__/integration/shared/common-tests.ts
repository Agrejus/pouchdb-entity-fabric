import { EntitySelector } from "../../../types/common-types";
import { IDbSet } from "../../../types/dbset-types";
import { IDbRecordBase } from "../../../types/entity-types";
import { PouchDbDataContextWithDefaults } from "./context";
import { DocumentTypes, ICar } from "./types";

export const shouldFilterEntitiesWithDefaults = async (
    createContext: () => typeof PouchDbDataContextWithDefaults,
    filter: (dbSet: IDbSet<DocumentTypes, ICar, "make">, selector: EntitySelector<DocumentTypes, ICar>, added: ICar) => Promise<ICar[]>,
    verifySaveAssertion: (data: ICar[]) => void) => {

    const context = createContext();

    const [first] = await context.carsWithDefault.add({
        manufactureDate: new Date(),
        model: "Some Model",
        year: 1
    });

    await context.saveChanges();

    const filtered = await filter(context.carsWithDefault, w => w._id === first._id, first);

    verifySaveAssertion(filtered)

    await context.destroyDatabase();
}

export const shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery = async (
    createContextOne: () => typeof PouchDbDataContextWithDefaults,
    createContextTwo: () => typeof PouchDbDataContextWithDefaults,
    filter: (dbSet: IDbSet<DocumentTypes, ICar, "make">, selector: EntitySelector<DocumentTypes, ICar>, added: ICar) => Promise<ICar[]>,
    verifySaveAssertionOne: (data: ICar[]) => void,
    verifySaveAssertionTwo: (data: IDbRecordBase[]) => void,
    verifySaveAssertionThree: (data: ICar[]) => void,
    verifySaveAssertionFour: (data: IDbRecordBase[]) => void) => {

    const context = createContextOne();

    const [first] = await context.carsWithDefault.add({
        manufactureDate: new Date(),
        model: "Some Model",
        year: 1
    });

    await context.saveChanges();

    const filtered = await filter(context.carsWithDefault, w => w._id === first._id, first);

    verifySaveAssertionOne(filtered)

    const allDocs = await context.getAllDocs();

    verifySaveAssertionTwo(allDocs)

    const context2 = createContextTwo();

    const filtered2 = await filter(context2.carsWithDefault, w => w._id === first._id, first);

    verifySaveAssertionThree(filtered2);

    const allDocs2 = await context2.getAllDocs();

    verifySaveAssertionFour(allDocs2);

    await context.destroyDatabase();
}