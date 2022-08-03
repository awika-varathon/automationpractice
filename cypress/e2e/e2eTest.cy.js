// import { groupBy, sumBy } from 'lodash';
// import * as _ from 'lodash'
// import moment = require('moment')


// const agencyReportConfigJSON = require(`/cypress/fixtures/golden-data/agencyReportConfig/agencyReportInfo.json`)


describe('Test e2e', () => {
        
    beforeEach(() => {
        // Preserve cookie in every test
        // Cypress.Cookies.defaults({
        //     preserve: (cookie) => {
        //         return true;
        //     }
        // })

        cy.clearCookies()

        // cy.visit('/');
    })
  
    it(`Test e2e`, () => {

        const waitTime = 5000;

        // testCase object's key and values 
        // orderFrom: 'visitPage[Dresses]', 'visitSubPage[Casual Dresses]', 'clickMenu[Dresses]', 'clickSubMenu[Casual Dresses]', 'search'
        // addToCartFrom: ['card', 'quickview', 'more']
        // processToCheckoutFrom: 'addProductWindow', 'cartHeader', '' <= means not checkout
        // deletedThisOrderFrom: 'cartHeader', 'shoppingCartSummary', '' <= means not deleted
        // editThisOrderQty: '2', '1', '' <= means not edit
        const testCase = {
            firstLogin: true,
            orderList: [
                { 
                    orderFrom: 'visitPage[Dresses]', 
                    addToCartFrom: 'card', 
                    name: 'Printed Dress', quantity: '1', size: 'S', color: 'orange', price: '26.00',
                    processToCheckoutFrom: 'card', 
                    deletedThisOrderFrom: '',
                    editThisOrderQty: '',
                    totalProducts: '26.00',
                    totalShipping: '2.00',
                    totalPrice: '28.00',
                    totalTax: '0.00',
                    totalCart: '28.00'
                }
            ],
            paymentMethod: 'bank wire',
            orderSummary: {
                orderList: [
                    { name: 'Printed Dress', quantity: '1', size: 'S', color: 'orange', price: '26.00'}
                ],
                totalProducts: '26.00',
                totalShipping: '2.00',
                totalPrice: '28.00',
                totalTax: '0.00',
                totalCart: '28.00'
            }
        }
        
        // ++++ Visit home page ++++
        cy.visit('/', {failOnStatusCode: false});
        cy.wait(waitTime);

         // ++++ Login ++++
        if(testCase['orderList']) {
            // Header: Login in from header 
            cy.loginFromHeader();
        }

        testCase['orderList'].forEach(order => {

            // ++++ To product's page from visit, click or search ++++
            // e.g. orderFrom = 'visitPage[Dresses]', 'visitSubPage[Casual Dresses]', 'clickMenu[Dresses]', 'clickSubMenu[Casual Dresses]', 'search' || 
            // e.g. visitOrClickName = 'visitPage[Dresses]' => 'Dresses'
            cy.log(`To product's page from: ${order['orderFrom']}`);
            const visitOrClickName = order['orderFrom'].split('[').pop().replace(']', '');
            // if(order['orderFrom'].contains('visit')) {
            //     // Visit: Visit catagory or sub catagory page
            //     cy.visitCatagoryPage(visitOrClickName);
            // } else if(order['orderFrom'].contains('click')) {
            //     // Header Menu: Click header menu to catagory page
            //     cy.clickToCatagoryPageFromMenu(visitOrClickName);
            // } else if(order['orderFrom'] === 'search') {
            //     // Search: 
            //     // cy.clickToCatagoryPageFromMenu(visitOrClickName);
            // }
            switch (true) {
                case order['orderFrom'].contains('visit'):
                    // Visit: Visit catagory or sub catagory page
                    cy.visitCatagoryPage(visitOrClickName);
                    break;
                case order['orderFrom'].contains('click'):
                    // Header Menu: Click header menu to catagory page
                    cy.clickToCatagoryPageFromMenu(visitOrClickName);
                    break;
                case order['orderFrom'] === 'search':
                    // Search: 
                    // cy.clickToCatagoryPageFromMenu(visitOrClickName);
                    break;
            }
            cy.wait(waitTime);

            // // ++++ Selected Product ++++
            // // Find product card, add class to closest 'li' to view more product details and button 'Add to cart' then click button "Add to cart" to add this product
            // cy.contains(`ul.product_list > li > .product-container .product-name`, orderList['name'])
            //     .closest('li')
            //     .invoke('addClass', 'hovered')
            //     .then($li => {
            //         cy.get($li).find(`.button-container a[title="Add to cart"]`).click();
            // });
            // cy.wait(waitTime);

            // // ++++ Process to checkout ++++
            // // // Closed "Add Product" Window
            // // closedAddProductWindow();
            // // cy.wait(waitTime);

            // // // Process to checkout from header's cart
            // // processToCheckoutFromCart();
            // // cy.wait(waitTime);

            // // Process to checkout from "Add Product" Window
            // processToCheckoutFromAddProductWindow();
            // cy.wait(waitTime);

            // // ++++ SHOPPING-CART ++++
            // // SHOPPING-CART-01.SUMMARY: Process to checkout
            // cy.get(`.cart_navigation a[title="Proceed to checkout"]`).click();
            // cy.wait(waitTime);

            // // SHOPPING-CART-02.SIGN IN: Login to my account
            // // if (!Cypress.$(`.header_user_info .account span:contains('${Cypress.env('USER_NAME')}')`)) {
            //     cy.loginMyAccount();
            //     cy.wait(waitTime);
            // // }
            
            // // SHOPPING-CART-03.ADDRESS: Process to checkout
            // processToCheckoutShoppingCartPage();
            // cy.wait(waitTime);

            // // SHOPPING-CART-04.SHIPPING: Process to checkout
            // cy.get(`#uniform-cgv input[type="checkbox"]`).check();
            // processToCheckoutShoppingCartPage();
            // cy.wait(waitTime);

            // // SHOPPING-CART-05.PAYMENT: Choose payment method
            // cy.get(`#HOOK_PAYMENT a[title="${paymentMethod}"]`).click(); 
            // cy.get('.cheque-box .cheque-indent strong')
            //     .should(($p) => {
            //         expect($p).to.contain(paymentMethod.toLowerCase());
            // }); 
            // processToCheckoutShoppingCartPage();
            // cy.wait(waitTime);

            // // SHOPPING-CART-06.SHIPPING: Order Confirmation
            // cy.get('.box')
            //     .then($text => {
            //         const orderText = $text.text().split('reference ').pop().split(' ').shift();
            //         // orderText = orderText.split(' ').shift();
            //         console.log($text.text());
            //         console.log(orderText);
            //         cy.task('setOrderReferenceDetail', orderText);
            // });
            // cy.wait(waitTime);

            // // Check order reference's detail in my account's order history page
            // cy.task('getOrderReferenceDetail').then(refNum => {
                
            //     console.log(refNum);

            //     clickToMyAccountPage();
            //     cy.wait(waitTime);

            //     // MY ACCOUNT: Check ref order
            //     cy.get('.myaccount-link-list a[title="Orders"]').click();
            //     cy.wait(waitTime);

            //     // Check order reference's detail
            //     cy.get('#order-list tr.first_item td:eq(0)')
            //         .should(($td) => {
            //             expect($td).to.contain(refNum); 
            //     }); 
            // });

        })

        
    })
});

// // Login at form account can from header or SHOPPING-CART SUMMARY Step 02. Sign in either have same element name
// export const loginMyAccount = () => {

//     const formAuth = `form[action="${Cypress.env('BASE_URL')}${Cypress.env('FORM_AUTH')}"]`;

//     cy.get(`${formAuth}[id="login_form"] .form_content`)
//         .within(() => {
//             cy.get('#email').type(Cypress.env('EMAIL'));
//             cy.get('#passwd').type(Cypress.env('PASSWORD'));
//             cy.get('#SubmitLogin').click();
//     });

//     // checkMyAccountLogin();
// }



// ++++ "Add Product" Window Element ++++
// Closed "Add Product" Window
export const closedAddProductWindow = () => {
    cy.get('#layer_cart .layer_cart_product .cross').click();
}

// Process to checkout from "Add Product" Window
export const processToCheckoutFromAddProductWindow = () => {
    cy.get('#layer_cart .layer_cart_cart a[title="Proceed to checkout"]').click();
}

// ++++ Header's Cart Element ++++
// Process to checkout from header's cart 
export const processToCheckoutFromCart = () => {
    cy.get('.header-container .shopping_cart .cart_block')
        .invoke('attr', 'style', 'display: block')
        .then($div => {
            cy.get($div).find('.cart-buttons #button_order_cart').click();
    })
}

// ++++ SHOPPING-CART Page Element ++++
export const processToCheckoutShoppingCartPage = () => {
    cy.get('.cart_navigation button[type="submit"]').click();
}
