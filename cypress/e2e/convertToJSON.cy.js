import { getReferenceFileName, getReferenceMappingJson} from '../support/util'

describe('Convert data to JSON', () => {

    beforeEach(() => {

        // Cypress.config('watchForFileChanges', false);
    });

    it(`Convert product's detail excel to JSON`, () => {

        let convertData = [];
        
        // Get product's detail from excel 
        // e.g. rows = [{"ID":1,"NAME":"Faded Short Sleeve T-shirts","SIZE":"s, m, l","COLOR":"orange, blue","AVAIL":"in stock","CATEGORY":"women, tops, t-shirts","FULL_PRICE":16.51,"IS_PRICES_DROP":"N","REFERENCE":"demo_1","CONDITION":"new","DESCRIPTION":"Faded short sleeve t-shirt with high neckline. Soft and stretchy material for a comfortable fit. Accessorize with a straw hat and you're ready for summer!","COMPOSITION":"cotton","STYLES":"casual","PROPERTIES":"short sleeve","MORE_INFO":"Fashion has been...","MANUFACTURER":"fashion manufacturer"},...]
        cy.task("readXlsx", { file: `${getReferenceFileName('productDetail')}.xlsx`, sheet: 'product'}).then((rows) => {

            console.log(rows);
            // console.log(Object.keys(rows[0]));

            // Get product's detail mapping from JSON
            const productDetailMapping = getReferenceMappingJson('productDetailMapping');
            console.log(productDetailMapping);

            // Loop convert each row as object array to new object key form product's detail mapping 
            // Note: Product's detail from excel column name set as real Database column name format (Snake Case). Need to covert column name which is object's key to be same format in script (Camal Case) 
            rows.forEach(row => {

                const newObject = {};

                // Loop product's detail mapping to set new object
                // e.g. productDetailMapping = [{ "name":"ID", "mappingName": "productId", "type": "text"},...]
                productDetailMapping.forEach(mapping => {

                    // Format data by object's type 
                    if(mapping.type === 'price') {
                        newObject[mapping.mappingName] =  row[mapping.name] ? Number(row[mapping.name]).toFixed(2) : '0.00';
                    } else if(mapping.type === 'number') {
                        newObject[mapping.mappingName] =  row[mapping.name] ? Number(row[mapping.name]).toFixed(0) : '0';
                    } else {
                        newObject[mapping.mappingName] =  row[mapping.name] ? row[mapping.name] : '';
                    }
                })
                convertData.push(newObject);
            })
            console.log(convertData);
        })

        // Write file to JSON
        cy.writeFile(`${getReferenceFileName('productDetail')}.json`, convertData)
    });
});