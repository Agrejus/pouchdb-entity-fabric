import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from 'uuid';
import { performance } from "perf_hooks";
import { DataContext } from "../../src/context/DataContext";
import { IDbRecord, IReferenceDbRecord } from "../../src/types/entity-types";

enum DocumentTypes {
    Notes = "Notes",
    Contacts = "Contacts",
    Books = "Books",
    Cars = "Cars",
    Preference = "Preference"
}


interface INote extends IDbRecord<DocumentTypes> {
    contents: string;
    createdDate: string;
    userId: string;
}

interface IBook extends IReferenceDbRecord<DocumentTypes, DocumentTypes, INote> {
    author: string;
    publishDate?: string;
    rejectedCount: number;
    status: "pending" | "approved" | "rejected";
}

interface ICar extends IDbRecord<DocumentTypes> {
    make: string;
    model: string;
    year: number;
    manufactureDate: Date;
}

interface IPreference extends IDbRecord<DocumentTypes> {
    isSomePropertyOn: boolean;
    isOtherPropertyOn: boolean;
}

interface IBaseEntity extends IDbRecord<DocumentTypes> {
    syncStatus: "pending" | "approved" | "rejected";
    syncRetryCount: 0;
}

class PouchDbDataContext extends DataContext<DocumentTypes> {

    constructor() {
        super(`${uuidv4()}-db`);
    }


    books = this.referenceDbSet<DocumentTypes, INote, IBook>(DocumentTypes.Books)
        .keys(w => w.auto())
        .create();
}

// const generateData = async (context: PouchDbDataContext, count: number) => {

//     try {

//         for (let i = 0; i < count; i++) {

//             await context.cars.add({
//                 make: faker.random.word(),
//                 manufactureDate: new Date(),
//                 model: faker.random.word(),
//                 year: +faker.random.numeric()
//             })

//             await context.contacts.add({
//                 address: faker.address.streetAddress(),
//                 firstName: faker.name.firstName(),
//                 lastName: faker.name.lastName(),
//                 phone: faker.phone.phoneNumber(),
//                 propertyEight: faker.random.word(),
//                 propertyEighteen: faker.random.word(),
//                 propertyEleven: faker.random.word(),
//                 propertyFifteen: faker.random.word(),
//                 propertyFive: faker.random.word(),
//                 propertyFour: faker.random.word(),
//                 propertyFourteen: faker.random.word(),
//                 propertyNine: faker.random.word(),
//                 propertyNineteen: faker.random.word(),
//                 propertyOne: faker.random.word(),
//                 propertySeven: faker.random.word(),
//                 propertySeventeen: faker.random.word(),
//                 propertySix: faker.random.word(),
//                 propertySixteen: faker.random.word(),
//                 propertyTen: faker.random.word(),
//                 propertyThirteen: faker.random.word(),
//                 propertyThirty: faker.random.word(),
//                 propertyThree: faker.random.word(),
//                 propertyTwelve: faker.random.word(),
//                 propertyTwenty: faker.random.word(),
//                 propertyTwentyEight: faker.random.word(),
//                 propertyTwentyFive: faker.random.word(),
//                 propertyTwentyFour: faker.random.word(),
//                 propertyTwentyNine: faker.random.word(),
//                 propertyTwentyOne: faker.random.word(),
//                 propertyTwentySeven: faker.random.word(),
//                 propertyTwentySix: faker.random.word(),
//                 propertyTwentyThree: faker.random.word(),
//                 propertyTwentyTwo: faker.random.word(),
//                 propertyTwo: faker.random.word(),
//                 randomNumber: Math.floor(Math.random() * 101)
//             });
//         }

//         await context.saveChanges();

//         //await context.optimize();
//         await context.$indexes.create(w => w.fields(x => x.add("randomNumber").add("DocumentType")).name("test-number-index").designDocumentName("test-number-index"));
//         const i = await context.$indexes.all();
//         console.log(i)
//     } catch (e) {
//         debugger;
//         console.log(e);
//     }
// }

export const run = async () => {
    try {
        debugger;
        const context = new PouchDbDataContext();
        const [added] = await context.books.add({
            author: "James",
            reference: {
                contents: "Note Contents",
                createdDate: "some date",
                userId: "some user id"
            },
            rejectedCount: 1,
            status: "pending"
        })

        await context.saveChanges();

        const [found] = await context.books.filter(w => w._id === added._id);
        debugger;
        console.log(found)
        // await generateData(context, 10000);

        // const s = performance.now();
        // const all = await context.contacts.filter(w => w.randomNumber === 10);
        // console.log(all.length);
        // const e = performance.now();
        // await context.destroyDatabase();
        // console.log('time', e - s);

        // if (true) {

        // }

    } catch (e) {
        debugger;
        console.log(e)
    }

}

run(); 