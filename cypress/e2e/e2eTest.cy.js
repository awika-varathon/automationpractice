// import { groupBy, sumBy } from 'lodash';
// import * as _ from 'lodash'
// import moment = require('moment')
// const agencyReportConfigJSON = require(`/cypress/fixtures/golden-data/agencyReportConfig/agencyReportInfo.json`)
import {covertOrderListValueCondition} from '../support/util'


describe('Test e2e', () => {
        
    beforeEach(() => {
        // Preserve cookie in every test
        // Cypress.Cookies.defaults({
        //     preserve: (cookie) => {
        //         return true;
        //     }
        // })

        cy.clearCookies()
        

        cy.intercept({ method: 'POST', url: /^http:\/\/automationpractice\.com\/index.php?.*/ }).as('loadQuickview')
        // http://automationpractice.com/index.php?id_product=6&controller=product&content_only=1
        // cy.visit('/');
    })
  
    it(`Test e2e`, () => {

        // testCase object's key and values 
        // orderFrom: 'visitPage[Dresses]', 'visitSubPage[Casual Dresses]', 'clickMenu[Dresses]', 'clickSubMenu[Casual Dresses]', 'search'
        // addToCartFrom: ['card', 'quickview', 'more']
        // processToCheckoutFrom: 'addProductWindow', 'cartHeader', '' <= means not checkout
        // deletedThisOrderFrom: 'cartHeader', 'shoppingCartSummary', '' <= means not deleted
        // editThisOrderQtyFrom: ['productDetailInput[2]', 'productDetailIcon[2]', 'shopingCartSummaryInput[1]', 'shopingCartSummaryIcon[1]'] <= [] means not edit
        const testCase = {
            firstLogin: false,
            orderList: [
                { 
                    orderFrom: 'visitPage[Women]', 
                    addToCartFrom: 'more', 
                    name: 'Faded Short Sleeve T-shirts', quantity: '2', size: 'M', color: 'Blue', price: '16.51',
                    processToCheckoutFrom: 'card', 
                    deletedThisOrderFrom: '',
                    editThisOrderQtyFrom: ['productDetailIcon[2]'],
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
                    { name: 'Faded Short Sleeve T-shirts', quantity: '2', size: 'M', color: 'Blue', price: '16.51'}
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
        cy.wait(Cypress.env('WAIT_TIME'));

         // ++++ Login ++++
        if(testCase['firstLogin']) {
            cy.log(`Login First`);
            // Header: Login in from header 
            cy.loginFromHeader();
        }

        testCase['orderList'].forEach(order => {

            // ++++ To product's page from visit, click or search ++++
            // e.g. orderFrom = 'visitPage[Dresses]', 'visitSubPage[Casual Dresses]', 'clickMenu[Dresses]', 'clickSubMenu[Casual Dresses]', 'search' || 
            
            cy.log(`To product's page from: ${order['orderFrom']}`);
            // orderListValue: Split and replace orderListValue to return value of condition
            // e.g. visitOrClickName = 'visitPage[Dresses]' => 'Dresses'
            const visitOrClickName = covertOrderListValueCondition(order['orderFrom']);
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

            // ++++ Selected Product from card, quickview or more++++
            // Card: Find product card by order's name, add class to closest 'li' to view more product details and buttons. Then click 'Add to cart' to add this product to cart or view more detail by click 'quickview' or 'more' select order's detail before add this product to cart 
            // e.g. addToCartFrom: 'card', 'quickview', 'more'
            cy.findAndSelectProductFromCard(order);
            cy.wait(Cypress.env('WAIT_TIME'));

            // TEST Direct
            // cy.visit(Cypress.env('BASE_URL') + 'id_product=1&controller=product', {failOnStatusCode: false});
            // cy.wait(Cypress.env('WAIT_TIME'));
            // cy.selectedProductFromProductDetail(order);

            // ++++ Process to checkout ++++
            // // Closed "Add Product" Window
            // closedAddProductWindow();
            // cy.wait(Cypress.env('WAIT_TIME'));

            // // Process to checkout from header's cart
            // processToCheckoutFromCart();
            // cy.wait(Cypress.env('WAIT_TIME'));

            // Process to checkout from "Add Product" Window
            processToCheckoutFromAddProductWindow();
            cy.wait(Cypress.env('WAIT_TIME'));

        });

        // ++++ SHOPPING-CART ++++
        // SHOPPING-CART-01.SUMMARY: Process to checkout
        cy.get(`.cart_navigation a[title="Proceed to checkout"]`).click();
        cy.wait(Cypress.env('WAIT_TIME'));

        // SHOPPING-CART-02.SIGN IN: Login to my account
        // if (!Cypress.$(`.header_user_info .account span:contains('${Cypress.env('USER_NAME')}')`)) {
            cy.loginMyAccount();
            cy.wait(Cypress.env('WAIT_TIME'));
        // }
        
        // SHOPPING-CART-03.ADDRESS: Process to checkout
        processToCheckoutShoppingCartPage();
        cy.wait(Cypress.env('WAIT_TIME'));

        // SHOPPING-CART-04.SHIPPING: Process to checkout
        cy.get(`#uniform-cgv input[type="checkbox"]`).check();
        processToCheckoutShoppingCartPage();
        cy.wait(Cypress.env('WAIT_TIME'));

        // SHOPPING-CART-05.PAYMENT: Choose payment method
        cy.get(`#HOOK_PAYMENT a[title="${testCase['paymentMethod']}"]`).click(); 
        cy.get('.cheque-box .cheque-indent strong')
            .should(($p) => {
                expect($p).to.contain(testCase['paymentMethod'].toLowerCase());
        }); 
        processToCheckoutShoppingCartPage();
        cy.wait(Cypress.env('WAIT_TIME'));

        // SHOPPING-CART-06.SHIPPING: Order Confirmation
        cy.get('.box')
            .then($text => {
                const orderText = $text.text().split('reference ').pop().split(' ').shift();
                // orderText = orderText.split(' ').shift();
                console.log($text.text());
                console.log(orderText);
                cy.task('setOrderReferenceDetail', orderText);
        });
        cy.wait(Cypress.env('WAIT_TIME'));

        // Check order reference's detail in my account's order history page
        cy.task('getOrderReferenceDetail').then(refNum => {
            
            console.log(refNum);

            clickToMyAccountPage();
            cy.wait(Cypress.env('WAIT_TIME'));

            // MY ACCOUNT: Check ref order
            cy.get('.myaccount-link-list a[title="Orders"]').click();
            cy.wait(Cypress.env('WAIT_TIME'));

            // Check order reference's detail
            cy.get('#order-list tr.first_item td:eq(0)')
                .should(($td) => {
                    expect($td).to.contain(refNum); 
            }); 
        });
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
