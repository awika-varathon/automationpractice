// ++++ Get Test Case & & Convent Value For Test Value ++++
// Excel: Get e2e test case's detail from excel by test case's name 
export const getE2EtestCaseFromExcel = (testCaseName) => {
    
    const testCaseDetail = {};
    let orderLists = [];
    let nowOrderLists = [];

    cy.task('readXlsx', { file: `${getReferenceFileName('e2eTestCase')}.xlsx`, sheet: testCaseName}).then((orders) => {
                
        console.log(`++++ ${testCaseName}: Get e2e test case's detail from excel ++++`);

        // Get product's detail mapping from JSON 
        // e.g. productsDetail = [{"ID":1,"NAME":"Faded Short Sleeve T-shirts","SIZE":"s, m, l","COLOR":"orange, blue","AVAIL":"in stock","CATEGORY":"women, tops, t-shirts","FULL_PRICE":16.51,"IS_PRICES_DROP":"N","REFERENCE":"demo_1","CONDITION":"new","DESCRIPTION":"Faded short sleeve t-shirt with high neckline. Soft and stretchy material for a comfortable fit. Accessorize with a straw hat and you're ready for summer!","COMPOSITION":"cotton","STYLES":"casual","PROPERTIES":"short sleeve","MORE_INFO":"Fashion has been...","MANUFACTURER":"fashion manufacturer"},...]
        const productsDetail = getReferenceMappingJson('productDetail');
        // console.log(productsDetail);
        // console.log(JSON.stringify(productsDetail[0]));

        // Loop each order detail from this test case to mapping order with product's detail, calculated total price and list now order by this row action which is add, delete or edit order
        // e.g. order = {"action":"add","orderNo ":1,"id":3,"name":"Printed Dress","qty":1,"size":"s","color":"orange","orderFrom":"clickMenu[Dresses]","addToCartFrom":"card","paymentMethod":"bank wire"}
        orders.forEach((order, index) => {

            // console.log(order);
            console.log(JSON.stringify(order));

            // Find this order product's detail by product's id 
            // Note:Need to find  by id beacause some product has same name
            const thisProductDetail = productsDetail.find(product => product['productId'] === order['id']);
            
            // Set variable 
            let orderUnitPrice, orderPrice, totalOrder, totalProducts, totalPrice, totalCart, totalProductsWithTax; 

            // Set total's shipping cost and tax 
            // Note: Still can't find logic to calculated rate for shipping cost and tax
            let totalShipping = 2;
            const totalTax = 0;

            // Get latest order with source in order list array for calculated all total fields 
            const latestOrder = orderLists[index-1];

            // Set order's unit price if this order is price drop ('Y'), set as produce discount's price else set as produce full price 
            // e.g. thisProductDetail = {..., "productFullPrice": "30.51", "productIsPriceDrop": "Y", "productPriceDiscount": "28.98", "productPercentDiscount": "5", ...}
            orderUnitPrice = thisProductDetail['productIsPriceDrop'] === 'Y' ? thisProductDetail['productPriceDiscount'] : thisProductDetail['productFullPrice'];

            // Calculated order's price by this order's unti price mutiple this order's qty 
            orderPrice = order['qty'] * Number(orderUnitPrice);
            // orderPrice = thisProductDetail['productIsPriceDrop'] === 'Y' ? order['qty'] * Number(thisProductDetail['productPriceDiscount']) : order['qty'] * Number(thisProductDetail['productFullPrice']);

            // Set this order's unit price and order's price to row for set in now order's list after
            // Note: order's unit price using for checking in SUMMARY-CART
            order['unitPrice'] = orderUnitPrice;
            order['price'] = Number(orderPrice).toFixed(2);

            // Loop convert some columns's order detail from string to array for using in test function
            // e.g. order['editThisOrderQtyFrom'] = 'productDetailInput[3], productDetailIcon[2]' => ['productDetailInput[3]', 'productDetailIcon[2]']
            const thisColumnIsArray = ['editThisOrderQtyFrom'];
            thisColumnIsArray.forEach(col => {
                order[col] = order[col] ? order[col].split(', ') : [];
            })

            // Get this order's index in nowOrderLists array by orderNo as order's deleted or edit id which using as element's eq in test fuction
            // Note: In test case detail need to set orderNo as unique running id for case delete and edit 
            const orderIndex = nowOrderLists.findIndex(list => list['orderNo'] === order['orderNo']);

            // Set all total fields's value by this order action which is add, delete or edit
            if(order['action'] === 'add') {
                // Action: 'add' = Add this order to cart 
                if(index === 0) {
                    // If 1st order, set totalOrder, totalProducts and totalPrice from this order detail
                    totalOrder = order['qty'];
                    totalProducts = orderPrice;
                    totalPrice = orderPrice + totalShipping;  
                } else {
                    // If not 1st order, set totalOrder, totalProducts and totalPrice this order detail add on latest order totalOrder, totalProducts and totalPrice
                    totalOrder =  latestOrder['totalOrder'] + order['qty'];
                    totalProducts = Number(latestOrder['totalProducts']) + orderPrice;
                    totalPrice = Number(latestOrder['totalPrice']) + orderPrice; 
                }

                // For action add, push this order's detail with product's detail to now order's lists
                nowOrderLists.push(Object.assign({}, order, thisProductDetail)); 

            } else if(order['action'] === 'delete') {
                // Action: 'delete' = deleted this order from cart which need to add this order before
                // Get this order's index in nowOrderLists array by orderNo as order's deleted id which using as element's eq in test fuction
                // Note: In test case detail need to set orderNo as unique running id for case delete and edit 
                // const orderIndex = nowOrderLists.findIndex(list => list['orderNo'] === order['orderNo']);

                // Set order's deletedRowId
                order['deletedRowId'] = orderIndex;
                // console.log(orderIndex);
                
                // Splice this order of now order's lists by index 
                nowOrderLists.splice(orderIndex, 1); 

                if(nowOrderLists.length === 0) {
                    // Set totalOrder, totalProducts and totalPrice this order detail subtract from latest order totalOrder, totalProducts and totalPrice
                    totalShipping = 0;
                    totalOrder =  0;
                    totalProducts = 0;
                    totalPrice = 0;
                } else {
                    // Set totalOrder, totalProducts and totalPrice this order detail subtract from latest order totalOrder, totalProducts and totalPrice
                    totalOrder =  latestOrder['totalOrder'] - order['qty'];
                    totalProducts = Number(latestOrder['totalProducts']) - orderPrice;
                    totalPrice = Number(latestOrder['totalPrice']) - orderPrice;
                }
            } else if(order['action'] === 'edit') {
                // Action: 'edit' = edit this order's qty in SHOPPING-CART-01.SUMMARY page which need to add this order before
                // Set order's editRowId 
                order['editRowId'] = orderIndex;
                // console.log(orderIndex);
                
                // Set changed's qty and price by edit's qty and price minus out order's qty price before edit from index of this order
                // e.g. nowOrderLists[orderIndex]['qty'](before edit) = 2, order['qty'](edit's qty) = 1, => changed's qty = -1
                const changedQty = order['qty'] - nowOrderLists[orderIndex]['qty'];
                const changedPrice = order['price'] - nowOrderLists[orderIndex]['price'];
                // console.log(changedQty + " " + changedPrice)

                // Updated this order's qty and price to nowOrderLists from index of this order
                nowOrderLists[orderIndex]['qty'] = order['qty'];
                nowOrderLists[orderIndex]['price'] = order['price'];

                // Set totalOrder, totalProducts and totalPrice this order detail from latest order totalOrder, totalProducts and totalPrice plus changed's qty and price which can be plus up or minus out
                totalOrder =  latestOrder['totalOrder'] + changedQty;
                totalProducts = Number(latestOrder['totalProducts']) + changedPrice;
                totalPrice = Number(latestOrder['totalPrice']) + changedPrice;
            }

            // Set totalCart as totalPrice (totalProducts + totalShipping) + totalTax (Note: Still can't find logic how to calculated tax)
            totalCart = totalPrice + totalTax;
            totalProductsWithTax = totalProducts + totalTax;
            const totalShippingText = totalShipping === 0 ? 'Free shipping!' : Number(totalShipping).toFixed(2); 
            console.log(Number(totalShippingText));

            // Set total price's detail's object
            const totalPriceDetail = {
                totalOrder: totalOrder,
                totalProducts: Number(totalProducts).toFixed(2),
                totalShipping: totalShippingText,
                totalPrice: Number(totalPrice).toFixed(2),
                totalTax: Number(totalTax).toFixed(2),
                totalCart: Number(totalCart).toFixed(2),
                totalProductsWithTax: Number(totalProductsWithTax).toFixed(2),
            }
            
            // Set full order's detail with this order's detail, product's detail, total price's detail and now order's lists and push to orderLists array
            // Note: Deep clone now order's lists array to not pointer back when push update next order in now order's lists
            const orderDetail = Object.assign({}, order, thisProductDetail, totalPriceDetail)
            // orderDetail['nowOrderLists'] = [...nowOrderLists];
            orderDetail['nowOrderLists'] = JSON.parse(JSON.stringify(nowOrderLists)); 
            orderLists.push(orderDetail);
            console.log(orderDetail);

            // If 1st order set firstLogin, paymentMethod, deliveryAddress and invoiceAddress to testCaseDetail's object
            if(index === 0) {
                testCaseDetail['firstLogin'] =  false;
                testCaseDetail['paymentMethod'] = order['paymentMethod'];

                // Get delivery address and invoice address from address detail's JSON by key
                testCaseDetail['deliveryAddress'] = getObjectFromReferenceMappingJson('addressDetail', order['deliveryAddress']);
                testCaseDetail['invoiceAddress'] = getObjectFromReferenceMappingJson('addressDetail', order['invoiceAddress'] );
            }

            // If last order set orderSummary's object to testCaseDetail's object
            // e.g. testCaseDetail = { ..., orderSummary: { nowOrderLists: [...], totalOrder: 2, ... } }
            if(index === orders.length-1) {
                const orderSummary = {};
                orderSummary['nowOrderLists'] = [...nowOrderLists];
                orderSummary['totalOrder'] = totalOrder;
                orderSummary['totalProducts'] = Number(totalProducts).toFixed(2);
                orderSummary['totalShipping'] = totalShippingText;
                orderSummary['totalPrice'] = Number(totalPrice).toFixed(2);
                orderSummary['totalTax'] = Number(totalTax).toFixed(2),
                orderSummary['totalCart'] = Number(totalCart).toFixed(2); 
                orderSummary['totalProductsWithTax'] = Number(totalProductsWithTax).toFixed(2); 

                testCaseDetail['orderSummary'] = orderSummary;
            }

        });

        // Set orderLists to testCaseDetail's object
        testCaseDetail['orderLists'] = orderLists;
        console.log(testCaseDetail);        
    });

    return testCaseDetail;
}

// orderListValue: Split and replace orderListValue to return value of condition
// e.g. orderListValue = 'visitPage[Dresses]' => 'Dresses'
export const convertOrderListValueCondition = (orderListValue) => {
    return orderListValue.split('[').pop().replace(']', '');
}

// Remove all text line breaks when get from function text()
export const removeTextLinebreaks = (str) => {
    let newStr = str;
    // newStr = newStr.replaceAll(/u00a0/g,'');
    // newStr = newStr.replaceAll(/\s/gm,'');
    newStr = newStr.replaceAll(/[\r\n\t]+/gm,'');
    return newStr 
    // return str.replaceAll( /[\r\n\t]+/gm,'').replaceAll(/(&nbsp;)*/g,'');
}

// ++++ Get Data From JSON & Pathfile Name ++++
// Get element for check product detail's JSON, JSON is set key same name as mainElementName
export const getReferenceMappingJson = (key) => {
    switch (key) {
        case 'elementForCheckOrderDetail':
            return require(`../fixtures/goldenData/websiteElementForCheckOrderDetail.json`);
        case 'productDetail':
            return require(`../fixtures/goldenData/produce_detail_db.json`);
        case 'productDetailMapping':
            return require(`../fixtures/goldenData/produceDetailMapping.json`);
        case 'addressDetail':
            return require(`../fixtures/goldenData/addressDetail.json`);
    } 
}

// Get object from reference mapping's JSON file by objectKey
export const getObjectFromReferenceMappingJson = (mappingJSONFileName, objectKey) => { 
    const referenceMappingJson = getReferenceMappingJson(mappingJSONFileName);
    return referenceMappingJson[objectKey];
}

// Get reference file name's pathfile
export const getReferenceFileName = (key) => {
    const object = {
       productDetail : 'cypress/fixtures/goldenData/produce_detail_db',
       e2eTestCase: 'cypress/fixtures/testCase/testCase_e2eTest'
    }
    return object[key];
}

// Get reference file name's pathfile
export const getPageLinkURL = (key) => {
    const pageLink = {
        dresses: 'id_category=8&controller=category',
        women: 'id_category=3&controller=category',
        tshirt: 'id_category=5&controller=category',
        blouses: 'id_category=7&controller=category',
        shoppingCartSummary: 'controller=order'
    }
    return pageLink[key];
}
    
// ++++ Check Product's Detail From Element Or Table ++++
// Loop check product detail from element value is equal order detail or not which each main element has different check element so need to find parent element first then set check element's id and order detail object's key
export const loopCheckOrderDetailFromElementValues = ($main, mainElementName, order) => {
    
    cy.log(`++++ Loop check product's detail from element values - ${mainElementName} ++++`);
    console.log(`++++ Loop check product's detail from element values - ${mainElementName} ++++`);

    // Get element's info from check product detail's JSON by mainElementName as objectKey
    const elementInfo = getObjectFromReferenceMappingJson('elementForCheckOrderDetail' , mainElementName);
    const $mainElement = $main === ''? elementInfo['mainElement'] : $main; 

    // Loop check product detail from element value is equal order detail
    // e.g. mappingCheckElementObject = [{ elementName: '.layer_cart_product .layer_cart_product_info', checkElement: [{ key: 'name', id: '#layer_cart_product_title', isMoney: false}, { key: 'color-size', id: '#layer_cart_product_attributes', isMoney: false}, { key: 'price', id: '#layer_cart_product_price', isMoney: true},]}, ... ];
    elementInfo['mappingCheckElementObject'].forEach(object => {

        cy.get($mainElement)
            .find(object['elementName'])
            .then($div => {
                // Loop check product detail from element value is equal order detail
                loopCheckElementAndCompareValues($div, object, order);
        })
    });
}

// Loop check all orders' details from each table's row's td is equal order detail or not which each main element has different check element so need to set check element's id and order detail object's key
export const loopCheckOrderDetailFromTableValues = ($table, mainElementName, nowOrderLists) => {

    // Get element's info from check product detail's JSON by mainElementName as objectKey
    const elementInfo = getObjectFromReferenceMappingJson('elementForCheckOrderDetail', mainElementName);
    const $tableElement = $table === ''? elementInfo['mainElement'] : $table; 

    // Loop check product detail from element value is equal order detail
    // e.g. mappingCheckElementObject = [{ elementName: '.layer_cart_product .layer_cart_product_info', checkElement: [{ key: 'name', id: '#layer_cart_product_title', isMoney: false}, { key: 'color-size', id: '#layer_cart_product_attributes', isMoney: false}, { key: 'price', id: '#layer_cart_product_price', isMoney: true},]}, ... ];
    elementInfo['mappingCheckElementObject'].forEach(object => {

        // Find table and loop all tr for checking all orders in cart by nowOrderLists 
        cy.get($tableElement)
            .find('tbody tr')
            .each(($tr, i) => {

                cy.log(`++++ Loop check product's detail from table values - ${mainElementName}: Row ${i} ++++`);
                console.log(`++++ Loop check product's detail from table values - ${mainElementName}: Row ${i} ++++`);
                console.log(nowOrderLists[i]);
                // Loop check product detail from element value is equal order detail
                loopCheckElementAndCompareValues($tr, object, nowOrderLists[i]);
        })
    });
    
}

// Loop check product detail from element value is equal order detail or not which each main element has different check element so need to set check element's id and order detail object's key
export const loopCheckElementAndCompareValues = ($div, object, order) => {

    
    // Loop check product detail from element value is equal order detail
    // e.g. checkElement = [{ key: 'name', id: '#layer_cart_product_title', isMoney: false}, { key: 'color-size', id: '#layer_cart_product_attributes', isMoney: false}, { key: 'price', id: '#layer_cart_product_price', isMoney: true},]}, ... ];
    object['checkElement'].forEach(element => {

        // console.log(element)
        console.log(JSON.stringify(element));

        // 
        if((element['checkShowHide'] && !order['productIsPriceDrop'] && order[element['key']] === '') || (element['checkShowHide'] && order['productIsPriceDrop'] === 'N')) {
            console.log(`${element['key']}: Element should not exist`);
            cy.get($div).find(element['id']).should('not.exist');
        } else {

            console.log(`${element['key']}: Element should exist & compare value`);

            // Get element's value from id or class and by element's type is text, input or attr
            let elementValue = '';
            if(element['type'] === 'text') {
                // If element's type is 'text', get value from text and replace all text line break
                elementValue = removeTextLinebreaks($div.find(element['id']).text());
                // elementValue = $div.find(element['id']).text();
                // elementValue = element['key'] === 'productPercentDiscount' ? removeTextLinebreaks(elementValue) : elementValue;
                // console.log('Text')
            } else if(element['type'] === 'input') {
                // If element's type is 'input', get value from value
                elementValue = $div.find(element['id']).val();
                // console.log('Input')
            } else if(element['type'].includes('attr')) {
                // If element's type includes 'attr', get attr's name by function convert before get attr's value
                // e.g. element['type'] = attr[title] => title
                elementValue = $div.find(element['id']).attr(convertOrderListValueCondition(element['type']));
                // console.log('Attr')
            }
            
            // Get baseValue from order detail by element's key
            let baseValue = '';
            if(element['key'] === 'color-size') {
                // If key is 'color-size', concat color and size with ', ' (e.g. baseValue = 'Orange, S')
                baseValue = `${order['color']}, ${order['size']}`
            } else if(element['key'] === 'color-size-table') {
                // If key is 'color-size-table', concat color and size with ', ' (e.g. baseValue = 'Color : Orange, Size : S')
                baseValue = `Color : ${order['color']}, Size : ${order['size']}`
            } else if(element['key'] === 'name-color-size-table') {
                // If key is 'name-color-size-table', concat name, color and size for this order's detail table format (e.g. baseValue = 'Printed Dress - Color : Orange, Size : S')
                baseValue = `${order['name']} - Color : ${order['color']}, Size : ${order['size']}`
            } else if(typeof order[element['key']] === 'number') {
                // If value is number, convert to string before compare
                baseValue = Number(order[element['key']]).toString();
            } else if(element['isMoney']){
                // If element's isMoney is true, Check if convert to number is number add '$' at front value, else set as order detail by element's key value (e.g baseValue = '$2.00', baseValue = 'Free shipping!')
                baseValue = !isNaN(order[element['key']])  ? `$${order[element['key']]}` : order[element['key']];
            } else {
                // Else set as order detail by element's key value
                baseValue =  order[element['key']];
            }

            // Set log message
            const message = `${element['key']} from element(${elementValue}) is equal raw data(${baseValue})`

            // Check if element's toLowerCase is true convert both value to lower case before compare
            if(element['toLowerCase']) {
                baseValue = baseValue.toLowerCase();
                elementValue = elementValue.toLowerCase();
            }

            cy.get($div)
                .should(($div) => {
                    // Check element's matchType
                    if(element['matchType'] === 'equal') {
                        // If matchType is equal compare to equal
                        expect(elementValue).to.equal(baseValue, message);
                    } else if(element['matchType'] === 'contains') {
                        // If matchType is contains compare to elementValue include in baseValue
                        expect(elementValue).to.include(baseValue, message);
                    }
            });
        }
    });
}



