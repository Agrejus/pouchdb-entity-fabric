import { example as addEntityToDataStore } from './getting-started/add-entity-to-data-store';
import { example as addEntitiesToDataStore } from './getting-started/add-entities-to-data-store';
import { example as createDataContext } from './getting-started/create-data-context';

export interface IExample {
    run: () => Promise<void>;
    name: string;
}

const processExamples = async () => {
    const examples = [
        addEntityToDataStore,
        createDataContext,
        addEntitiesToDataStore
    ];

    for (let example of examples) {
        console.log(`Running Example: ${example.name}`);
        await example.run();
    }
}

processExamples();