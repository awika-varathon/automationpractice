// import { groupBy, sumBy } from 'lodash';
// import * as _ from 'lodash'
// const agencyReportConfigJSON = require(`/cypress/fixtures/golden-data/agencyReportConfig/agencyReportInfo.json`)
import {getE2EtestCaseFromExcel, convertOrderListValueCondition, getPageLinkURL} from '../support/util'
import { slowCypressDown } from 'cypress-slow-down'

const e2eTestCaseArray = ['e2e_e01', 'e2e_e02']
// add = 'e2e_a01', 'e2e_a02', 'e2e_a03', 'e2e_a04', 'e2e_a05', 'e2e_a06', 'e2e_a07'
// delete = 'e2e_d01', 'e2e_d02', 'e2e_d03', 'e2e_d04'
// edit = 'e2e_e01', 'e2e_e02'

slowCypressDown();

e2eTestCaseArray.forEach((testCaseName, index) => {
    
    describe(`${index+1}.${testCaseName}-e2e Test `, () => {

        let testCaseDetail = [];
        
        it(`${testCaseName}: Get test case detail from Excel`, () => {
            testCaseDetail = getE2EtestCaseFromExcel(testCaseName);
        });
      
        beforeEach(() => {
            // // Preserve cookie in every test
            // Cypress.Cookies.defaults({
            //     preserve: (cookie) => {
            //         return true;
            //     }
            // })
    
            cy.clearCookies(); // Clear cookie to no remember username and password for form
            
            cy.intercept({ method: 'POST', url: /http:\/\/www\.automationpractice.pl\/.*/ }).as('loadQuickview')
            // http://automationpractice.pl/index.php?id_product=6&controller=product&content_only=1
            // cy.visit('/');
        })

        it(`${testCaseName}: Start e2e test in website`, () => {
            
            // TEST Direct
            // cy.visit(Cypress.env('BASE_URL') + 'id_product=1&controller=product', {failOnStatusCode: false});
            // cy.wait(Cypress.env('WAIT_TIME'));
            // cy.selectedProductFromProductDetail(order);

            cy.log(`++++ ${testCaseName}: Start e2e test in website ++++`);
            console.log(`++++ ${testCaseName}: Start e2e test in website ++++`);
            console.log(testCaseDetail);

            // ++++ Visit home page ++++
            cy.visit('/', {failOnStatusCode: false});
            cy.wait(Cypress.env('WAIT_TIME')); 
    
            // ++++ Login: First time login  ++++
            if(testCaseDetail['firstLogin']) {
                cy.doActionFromHeaderUserInfo('headerLogin');
            }
            
            // ++++ Orders: Loop all this test case's orderLists to do action order which is 'add', 'delete' or 'edit'  ++++
            testCaseDetail['orderLists'].forEach((order, i) => {

                // if(i > 0 ) { // For Debug Only
                cy.log(`++++ ${testCaseName}: Do action order ${i+1}- ${order['action']}++++`);
                console.log(`++++ ${testCaseName}: Do action order ${i+1}- ${order['action']}++++`);
                console.log(order);
    
                if(order['action'] === 'add') {
                    
                    // ++++ Add: Order List Value Split and replace orderListValue to return value of condition ++++
                    // e.g. visitOrClickName = 'visitPage[Dresses]' => 'Dresses'
                    const visitOrClickName = convertOrderListValueCondition(order['orderFrom']);
                    
                    // ++++ To product's page from visit, click or search ++++
                    // e.g. orderFrom = 'visitPage[Dresses]', 'visitSubPage[Casual Dresses]', 'clickMenu[Dresses]', 'clickSubMenu[Casual Dresses]', 'search' || 
                    cy.log(`To product's page from: ${order['orderFrom']}`);
                    switch (true) {
                        case order['orderFrom'].includes('visit'):
                            // Visit: Visit catagory or sub catagory page
                            cy.visitCatagoryPage(visitOrClickName);
                            break;
                        case order['orderFrom'].includes('click'):
                            // Header Menu: Click header menu to catagory page
                            cy.clickToCatagoryPageFromMenu(visitOrClickName);
                            break;
                        case order['orderFrom'] === 'search':
                            // Search: 
                            // cy.clickToCatagoryPageFromMenu(visitOrClickName);
                            break;
                        case order['orderFrom'] === '':
                            break;
                    }
                    cy.wait(Cypress.env('WAIT_TIME'));
        
                    // ++++ Selected product from 'card', 'quickview' or 'more'++++
                    // Card: Find product card by order's name, add class to closest 'li' to view more product details and buttons. Then click 'Add to cart' to add this product to cart or view more detail by click 'quickview' or 'more' select order's detail before add this product to cart 
                    // e.g. addToCartFrom: 'card', 'quickview', 'more'
                    cy.findAndSelectProductFromCard(order);
                    cy.wait(Cypress.env('WAIT_TIME'));
        
                    // ++++ "Add Product" Window: After add product to cart ++++
                    // [For New Website(.pl)] Do nothing because "Add Product" Window is error
                    // "Add Product" Window: Check product detail in "Add Product" Window is equal as order's detail value
                    // cy.checkOrderDetailInAddProductWindow(order);
                    // cy.wait(Cypress.env('WAIT_TIME'));

                    // "Add Product" Window: Checking next step is checkout or select do action next order
                    // if(order['proceedToCheckoutFrom'] === 'addProductWindow') {
                    //     // "Add Product" Window: Click "proceed to checkout" from "Add Product" Window
                    //     cy.proceedToCheckoutFromAddProductWindow();
                    //     cy.wait(Cypress.env('WAIT_TIME'));
                    // } else {
                    //     // "Add Product" Window: Close "Add Product" Window
                    //     cy.closedAddProductWindow();
                    //     cy.wait(Cypress.env('WAIT_TIME'));    
                    // }
                } else if(order['action'] === 'delete') {

                    // ++++ Delete: Deleted this order by condition ++++
                    if(order['deletedThisOrderFrom'] === 'cartHeader') {
                        // Header Cart: Deleted this order from header's cart
                        cy.doActionInHeaderCart({ type: 'deletedThisOrder', order: order });
                        cy.wait('@loadQuickview');
                        cy.wait(Cypress.env('WAIT_TIME'));

                        // [For New Website (.pl)]: Click body to close error popup and visit homepage to update delete order which not realtime likes old website
                        cy.wait('@loadQuickview'); 
                        cy.get('body').click(0,0);
                        cy.visit('/'); 
                        cy.wait(Cypress.env('WAIT_TIME'));

                    } else if(order['deletedThisOrderFrom'] === 'shoppingCartSummary') {

                        // Header Cart: Click "Proceed to checkout" from header's cart
                        cy.doActionInHeaderCart({ type: 'proceedToCheckout' }); 
                        cy.wait(Cypress.env('WAIT_TIME'));

                        // SHOPPING-CART-01.SUMMARY: Deleted this order from SHOPPING-CART table
                        cy.doActionInShoppingCartSummaryTable({ type: 'deletedThisOrder', order: order });
                        cy.wait(Cypress.env('WAIT_TIME'));
                    
                        // [For New Website (.pl)]: Click body to close error popup and click "Proceed to checkout" from header's cart again to update delete order in table which not realtime likes old website
                        cy.wait('@loadQuickview'); 
                        cy.get('body').click(0,0);
                        cy.doActionInHeaderCart({ type: 'proceedToCheckout' }); 
                        cy.wait(Cypress.env('WAIT_TIME'));

                        // SHOPPING-CART: Check all order's detail in SHOPPING-CART table
                        cy.doActionInShoppingCartSummaryTable({ type: 'checkOrdersDetail', order: order }); 
                        cy.wait(Cypress.env('WAIT_TIME'));
                        // cy.checkProductDetailTotalFromTableValues(order);

                    }
                } else if(order['action'] === 'edit') {
                    // Header Cart: Click "Proceed to checkout" from header's cart
                    cy.doActionInHeaderCart({ type: 'proceedToCheckout' }) 
                    cy.wait(Cypress.env('WAIT_TIME'));

                    // SHOPPING-CART: Edited this order's qty from SHOPPING-CART table
                    cy.doActionInShoppingCartSummaryTable({ type: 'editThisOrder', order: order })
                    // cy.wait(Cypress.env('WAIT_TIME')); 

                    // SHOPPING-CART: Check all order's detail in SHOPPING-CART table
                    cy.doActionInShoppingCartSummaryTable({ type: 'checkOrdersDetail', order: order }) 
                    cy.wait(Cypress.env('WAIT_TIME'));
                }

                // Header Cart: Check all order's detail in header's cart
                cy.doActionInHeaderCart({ type: 'checkOrdersDetail', order: order }) 
                cy.wait(Cypress.env('WAIT_TIME'));  
                
                // Header Cart: Click "Proceed to checkout" from header's cart && Not at summary page
                if(order['proceedToCheckoutFrom'] === 'cartHeader') {
                    cy.doActionInHeaderCart({ type: 'proceedToCheckout' }) 
                    cy.wait(Cypress.env('WAIT_TIME'));
                }

                // } // For Debug Only
            });
    
            // ++++ SHOPPING-CART ++++
            // SHOPPING-CART-01.SUMMARY: Check all order's detail in SHOPPING-CART table
            const orderSummary = testCaseDetail['orderSummary'];
            cy.url()
                .then(pageURL => {
                    console.log(pageURL);

                    // Checking if not at SHOPPING-CART-01.SUMMARY page then clicking 'Proceed to check' from header's cart before checking order's detail
                    // e.g. pageURL = 'http://automationpractice.pl/index.php?controller=order' 
                    if(!pageURL.includes(getPageLinkURL('shoppingCartSummary'))) {
                        cy.doActionInHeaderCart({ type: 'proceedToCheckout' }) 
                        cy.wait(Cypress.env('WAIT_TIME'));
                    }
                    
                    // SHOPPING-CART: Checking all order's detail in SHOPPING-CART table
                    cy.doActionInShoppingCartSummaryTable({ type: 'checkOrdersDetail', order: orderSummary });
                    
                    // SHOPPING-CART: Click 'Proceed to checkout' Do only have order list in orderSummary
                    if(orderSummary['nowOrderLists'].length > 0) {
                        cy.get('.cart_navigation a[title="Proceed to checkout"]').click();
                    } 
            })
            
            // SHOPPING-CART-02-06. Do only have order list in orderSummary
            if(orderSummary['nowOrderLists'].length > 0) {
                // ++++
                // SHOPPING-CART-02.SIGN IN: Login to my account if firstLogin is false and not already login 
                if(!testCaseDetail['firstLogin']) {
                    cy.doActionFromHeaderUserInfo('login');
                }
                
                // ++++
                // SHOPPING-CART-03.ADDRESS: Choose delivery address and billing address and checking both detail in each ul
                cy.doActionInShoppingCartAddress({deliveryAddress: testCaseDetail['deliveryAddress'], invoiceAddress: testCaseDetail['invoiceAddress']})
                
                // SHOPPING-CART-03.ADDRESS: Click proceed to checkout
                cy.proceedToCheckoutShoppingCartPage();
                cy.scrollTo('bottom');
                cy.wait(3000);
        
                // // ++++
                // // SHOPPING-CART-04.SHIPPING: Checking 'I agree to the terms..'
                // cy.get(`#uniform-cgv input[type="checkbox"]`).check();

                // // SHOPPING-CART-04.SHIPPING: Click 'Proceed to checkout'
                // cy.proceedToCheckoutShoppingCartPage();
                // cy.wait(Cypress.env('WAIT_TIME'));
        
                // // ++++
                // // SHOPPING-CART-05.PAYMENT: Choose payment method by click a which is bank wire or check
                // // e.g. title="Pay by bank wire", title="Pay by check."
                // cy.get(`#HOOK_PAYMENT a[title*="${testCaseDetail['paymentMethod']}"]`).click();

                // // SHOPPING-CART-05.PAYMENT: Check payment's detail is correct or not
                // cy.get('.cheque-box .cheque-indent strong')
                //     .should(($p) => {
                //         expect($p).to.contain(testCaseDetail['paymentMethod'].toLowerCase());
                // }); 

                // // SHOPPING-CART-05.PAYMENT: Click 'Proceed to checkout'
                // cy.proceedToCheckoutShoppingCartPage();
                // cy.wait(Cypress.env('WAIT_TIME'));
        
                // // const orderSummary = testCaseDetail['orderSummary'];

                // // ++++
                // // SHOPPING-CART-06.SHIPPING: Order Confirmation
                // // cy.get('#center_column') // For Debug Only
                // cy.get('.box')
                //     .then($text => {

                //         // console.log($text.text());
                //         // Set as array to checking a order history table
                //         // e.g. orderReference = [{orderReference: 'QVDNYVYCF', orderDate: '08/25/2022', orderPrice: '47.49', orderPaymentMethod: 'check', orderStatus: 'On backorder', 'orderCarrier': 'My carrier','orderShipping: '2.00'}]
                //         const orderReference = {};

                //         // e.g. check = '..- Do not forget to include your order reference IFNHCZZGN.\n\t\t\t\t-'
                // 	    // e.g. bank = '..- Do not forget to insert your order reference PUGEWKFTO in the subject of your bank wire.'
                //         orderReference['orderReference'] = $text.text().split('reference ').pop().split(' ').shift().split('.').shift();
                //         orderReference['orderDate'] = moment(new Date()).format('MM/DD/YYYY');
                //         orderReference['orderPrice'] = orderSummary['totalPrice'];
                //         orderReference['orderPaymentMethod'] = testCaseDetail['paymentMethod'];
                //         orderReference['orderStatus'] = 'On backorder';
                //         orderReference['orderCarrier'] = 'My carrier';
                //         orderReference['orderWeight'] = '-';
                //         orderReference['orderShipping'] = orderSummary['totalShipping'];
                //         orderReference['orderTrackingNumber'] = '-';

                //         // For Debug Only
                //         // orderReference['orderReference'] = 'BHBVJDIBX';
                //         // orderReference['orderDate'] = '09/13/2022';
                //         // orderReference['orderPrice'] = orderSummary['totalPrice'];
                //         // orderReference['orderPaymentMethod'] = testCaseDetail['paymentMethod'];
                //         // orderReference['orderStatus'] = 'On backorder';
                //         // orderReference['orderCarrier'] = 'My carrier';
                //         // orderReference['orderWeight'] = '-';
                //         // orderReference['orderShipping'] = orderSummary['totalShipping'];
                //         // orderReference['orderTrackingNumber'] = '-';
                //         console.log(orderReference);
                //         cy.task('setOrderReferenceObject', orderReference);
                // });
                // cy.wait(Cypress.env('WAIT_TIME'));
        
                // // ++++
                // // ORDER HISTORY: Check order reference's detail in my account's order history page
                // cy.task('getOrderReferenceObject').then(orderReference => {
                    
                //     console.log(orderReference);
        
                //     // Header: Click username from header to my account page
                //     cy.doActionFromHeaderUserInfo('toMyAccount');
                //     cy.wait(Cypress.env('WAIT_TIME'));
        
                //     // MY ACCOUNT: Click to ORDER HISTORY AND DETAILS page
                //     cy.get('.myaccount-link-list a[title="Orders"]').click();
                //     cy.wait(Cypress.env('WAIT_TIME'));
        
                //     // ORDER HISTORY: Checking order reference's detail
                //     cy.doActionInOrderHistoryPage({ type: 'checkOrder', mainElementName: 'orderHistoryTbody', object: orderReference})

                //     // ORDER HISTORY: Click to show this order's detail
                //     cy.doActionInOrderHistoryPage({ type: 'showThisOrderDetail'})
                //     cy.wait(Cypress.env('WAIT_TIME'));

                //     // ORDER HISTORY: This order's detail - Checking submit reorder section's detail
                //     cy.doActionInOrderHistoryPage({ type: 'checkOrder', mainElementName: 'orderHistorySubmitReorderSection', object: orderReference})

                //     // ORDER HISTORY: This order's detail - Checking payment method section's detail
                //     cy.doActionInOrderHistoryPage({ type: 'checkOrder', mainElementName: 'orderHistoryPaymentMethodSection', object: orderReference})

                //     // ORDER HISTORY: This order's detail - Checking delivery address section's detail
                //     cy.doActionInOrderHistoryPage({ type: 'checkOrder', mainElementName: 'orderHistoryDeliveryAddressSection', object: testCaseDetail['deliveryAddress']})

                //     // ORDER HISTORY: This order's detail - Checking bill address section's detail
                //     cy.doActionInOrderHistoryPage({ type: 'checkOrder', mainElementName: 'orderHistoryBillAddressSection', object: testCaseDetail['invoiceAddress']})

                //     // ORDER HISTORY: This order's detail - Checking order detail table tbody section's detail
                //     cy.doActionInOrderHistoryPage({ type: 'checkOrderTable', mainElementName: 'orderHistoryOrderDetailTbody', object: orderSummary['nowOrderLists']})

                //     // ORDER HISTORY: This order's detail - Checking order detail table tfoot section's detail
                //     cy.doActionInOrderHistoryPage({ type: 'checkOrder', mainElementName: 'orderHistoryOrderDetailTfoot', object: orderSummary})

                //     // ORDER HISTORY: This order's detail - Checking footable section's detail
                //     cy.doActionInOrderHistoryPage({ type: 'checkOrder', mainElementName: 'orderHistoryFootableSection', object: orderReference})
                // });
                
                // // ++++
                // // Header: Click username from header to my account page
                // cy.doActionFromHeaderUserInfo('logout');
                // cy.wait(Cypress.env('WAIT_TIME'));
            } 
        });
    });    
})



