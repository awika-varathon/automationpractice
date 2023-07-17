// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
import { find } from 'lodash';
import {
    getPageLinkURL,
    convertOrderListValueCondition,
    loopCheckOrderDetailFromElementValues,
    loopCheckOrderDetailFromTableValues,
} from '../support/util'

// ++++ Visit ++++
// Visit: Visit catagory or sub catagory page
// e.g. catagotyName = Tshirt => tshrit, URL = http://automationpractice.pl/index.php?id_category=5&controller=category
Cypress.Commands.add('visitCatagoryPage', (catagotyName) => {
    console.log(`Visit Catagory Page - ${catagotyName}`);
    cy.visit(Cypress.env('BASE_URL') + getPageLinkURL(catagotyName.toLowerCase()), { failOnStatusCode: false });

});


// ++++ Login ++++
// Login: Login at form's account can login from header or SHOPPING-CART SUMMARY 'Step 02.Sign in', either have same element name
Cypress.Commands.add('loginMyAccount', () => {

    const formAuth = `form[action="${Cypress.env('BASE_URL')}${Cypress.env('FORM_AUTH')}"]`;

    cy.get(`${formAuth}[id="login_form"] .form_content`)
        .within(() => {
            console.log(`Login at form's account`);
            cy.get('#email').type(Cypress.env('EMAIL'));
            cy.get('#passwd').type(Cypress.env('PASSWORD'));
            cy.get('#SubmitLogin').click();
        });
});

// ++++ Header User Element ++++
Cypress.Commands.add('doActionFromHeaderUserInfo', (type = '') => {
    cy.get('.header_user_info')
        .then($info => {
            // Checking already login by find info's element has account's element or not

            if (type === 'headerLogin' || type === 'login') {
                if ($info.find('.account').length === 0) {
                    // Login: If info's element doesn't have account's element then login from header or 'Already Registered?' Box 
                    cy.log(`++++ Header User Info: Login First Time From - ${type} ++++`);
                    console.log(`++++ Header User Info: Login First Time From - ${type} ++++`);
                    switch (type) {
                        case 'headerLogin':
                            // Header: Login from header 
                            cy.get($info).find('.login').click();
                            cy.loginMyAccount();
                            break;
                        case 'login':
                            // Else: Login from 'Already Registered?' Box  
                            cy.loginMyAccount();
                            break;
                    }
                    cy.wait(Cypress.env('WAIT_TIME'));

                    // Login: Check that login correctly from header's user info is changed from 'Sign in' to 'USER_NAME' 
                    cy.get('.header_user_info')
                        .find('.account span')
                        .should(($account) => {
                            expect($account).to.contain(Cypress.env('USER_NAME'));
                        });
                } else {
                    // Login: Else means already login so do nothing
                    cy.log(`++++ Header User Info: Already Login ++++`);
                    console.log(`++++ Header User Info: Already Login ++++`);
                }
            } else if (type === 'logout') {
                // Logout: If type is 'logout', click logout to logout from this account
                cy.log(`++++ Header User Info: Logout ++++`);
                console.log(`++++ Header User Info: Logout ++++`);
                cy.get($info).find('.logout').click();
            } else if (type === 'toMyAccount') {
                // My Account: If type is 'toMyAccount', click username from header to my account page
                cy.log(`++++ Header User Info: To My Account Page ++++`);
                console.log(`++++ Header User Info: To My Account Page ++++`);
                cy.get('.header_user_info').find('.account span').click();
            }
        });
});

// ++++ Header Menu Element ++++
// Header Menu: Click header menu to catagory page
Cypress.Commands.add('clickToCatagoryPageFromMenu', (menuName) => {
    console.log(`To product's page from: Click header menu - ${menuName}`);
    cy.get(`#block_top_menu > ul > li > a[title="${menuName}"]`).click({ force: true });
});

// ++++ Card Order Element ++++
// Card: Find product card by order's name and id (In case product has same name), add class 'hovered' to closest 'li' to view more product details and buttons. Then click 'Add to cart' to add this product to cart or view more detail by click 'quickview' or 'more' select order's detail before add this product to cart 
Cypress.Commands.add('findAndSelectProductFromCard', (order) => {
    // cy.contains(`ul.product_list > li > .product-container .product-name`, order['name'])
    cy.get(`ul.product_list > li > .product-container`)
        .find(`.product-name[title="${order['name']}"][href="${Cypress.env('BASE_URL')}id_product=${order['id']}&controller=product"]`)
        .closest('li')
        // .invoke('addClass', 'hovered')
        .trigger('mouseover')
        .then($li => {
            switch (order['addToCartFrom']) {
                case 'card':
                    // Card: Click 'Add to cart'
                    cy.get($li).find(`.button-container a[title="Add to cart"]`).click();
                    cy.wait(Cypress.env('WAIT_TIME'));

                    // [For New Website (.pl)]: Visit homepage to clear popup's detail error
                    cy.visit('/', { failOnStatusCode: false });
                    break;
                case 'quickview':
                    // Card: Click 'Quickview' and select product from order detail
                    cy.get($li).find(`.quick-view`).click();
                    // cy.wait(30000);
                    cy.wait('@loadQuickview')
                    cy.selectedProductFromProductDetailQuickview(order);
                    break;
                case 'more':
                    // Card: Click 'more' and select product from order detail
                    cy.get($li).find(`.button-container a[title="View"]`).click();
                    cy.selectedProductFromProductDetail(order);
                    break;
            }
        });
});


// ++++ Selected Product Detail Element ++++
// Product Detail: Page 'More'. Selected product quantity, size and color in product detail's part then add to cart
// e.g. order = {..., name: 'Printed Dress', qty: '1', size: 'S', color: 'Orange', price: '26.00', editThisOrderQtyFrom: 'addToCartInput[2]' || }
Cypress.Commands.add('selectedProductFromProductDetail', (order) => {

    cy.get(`.primary_block`)
        .find('form#buy_block')
        .then($form => {

            // Quantity: Edit product's qty by.Input or Click icon
            cy.editProductQtyFromInputOrIcon(order['editThisOrderQtyFrom'], '.box-info-product', '#quantity_wanted_p', 'page');

            // Size: Select size by.select option
            cy.get($form).find(`.attribute_list select`).select(order['size']);

            // Color: Select color by click a which title is same as color 
            cy.get($form).find(`ul#color_to_pick_list a[title=${order['color']}]`).click();
            cy.wait(Cypress.env('WAIT_TIME'));

            // Button: Click 'Add to cart' and wait for response
            cy.get($form).find(`.box-cart-bottom button[name="Submit"]`).click();
            cy.wait('@loadQuickview')
            cy.wait(3000);

            // [For New Website (.pl)]: Visit homepage to clear popup's detail error
            cy.visit('/', { failOnStatusCode: false });
        });
});

// Product Detail: 'Quickview' Popup. Selected product quantity, size and color in product detail's part then add to cart 
// Note: Old website is same element as Page 'More' but New website using iframe which works differently
// e.g. order = {..., name: 'Printed Dress', qty: '1', size: 'S', color: 'Orange', price: '26.00', editThisOrderQtyFrom: 'addToCartInput[2]' || }
Cypress.Commands.add('selectedProductFromProductDetailQuickview', (order) => {

    cy.get('iframe.fancybox-iframe')
        .should('be.visible')
        .then($iframe => {
            const $body = $iframe.contents().find('body')
            cy.wrap($body)
                .find('form#buy_block')
                .then($form => {

                    // Quantity: Edit product's qty by.Input or Click icon
                    cy.editProductQtyFromInputOrIcon(order['editThisOrderQtyFrom'], $form, '#quantity_wanted_p', 'quickview');

                    // Size: Select size by.select option
                    cy.get($form).find(`.attribute_list select`).select(order['size']);

                    // Color: Select color by click a which title is same as color 
                    cy.get($form).find(`ul#color_to_pick_list a[title=${order['color']}]`).click();
                    cy.wait(Cypress.env('WAIT_TIME'));

                    // Button: Click 'Add to cart' and wait for response
                    cy.get($form).find(`.box-cart-bottom button[name="Submit"]`).click();
                    cy.wait('@loadQuickview')
                    cy.wait(3000);

                    // [For New Website (.pl)]: Visit homepage to clear popup's detail error
                    cy.visit('/', { failOnStatusCode: false });

                });
        });
});

// Edit product's qty which can edit from 2 sections 1. From product detail page 2. SHOPPING-CART Summary page concept of edit qty both sections are same but different element's name, set value as array in case want to loop increase or decrease product's qty 
// e.g. editThisOrderQtyFrom = ['productDetailInput[2]', 'productDetailIcon[2]'] || ['shopingCartSummaryInput[1]', 'shopingCartSummaryIcon[2]'] 
Cypress.Commands.add('editProductQtyFromInputOrIcon', (editThisOrderQtyFrom, $mainElement = '', $findElement = '', section = 'page') => {

    // Loop edit product's qty from setting in each value
    editThisOrderQtyFrom.forEach(editThisOrder => {

        cy.log(`Edit this order qty from: ${editThisOrder}`);

        // Check editThisOrder's value if includes 'productDetail' means edit Qty from product detail's page set input's element's name as 'input#quantity_wanted' if set element's name as 'input.cart_quantity_input'
        const inputElement = editThisOrder.includes('productDetail') ? 'input#quantity_wanted' : `input.cart_quantity_input`;

        // orderListValue: Split and replace orderListValue to return value of condition as editQty
        // e.g. editQty = 'productDetailInput[2]' => '2'
        const editQty = convertOrderListValueCondition(editThisOrder)

        // Get qty box's element and edit Value by input or click icon
        // [For New Website (.pl)]: Change to get $mainElement first before find $findElement to support case quickview which need to set wrap iframe element $mainElement to find element inside element
        cy.get($mainElement)
            .find($findElement)
            .then($ele => {

                // Find input's value first as nowQty checking if nowQty equel editQty do not edit
                const nowQty = $ele.find(inputElement).val();
                if (nowQty !== editQty) {

                    cy.log(`nowQty !== editQty`);
                    if (editThisOrder.includes('Input')) {
                        // If editThisOrder includes 'Input', edit product's qty from input by type
                        // Note: For input need to click first to trigger change
                        cy.log(`Edit this order qty by. Input`);
                        cy.get($ele).find(inputElement).click().clear().type(editQty);
                        // $ele.find(`input`).val(editQty);
                    } else if (editThisOrder.includes('Icon')) {
                        // If editThisOrder includes 'Icon', edit product's qty from click icon which is plus(increase) or minus(decrease)
                        // Check if editQty > nowQty set button's class as '.button-plus' else '.button-minus' and loop click from result of editQty minus nowQty convert to possive number only by function Math.abs
                        // e.g. editQty(1)-nowQty(3) => -2 => 2)
                        cy.log(`Edit this order qty by. Click Icon`);
                        console.log(`Edit this order qty by. Click Icon`);
                        const iconClass = editQty > nowQty ? '.button-plus' : '.button-minus';
                        for (let i = 0; i < Math.abs(editQty - nowQty); i++) {
                            cy.get($ele).find(iconClass).click();
                            cy.wait(Cypress.env('WAIT_TIME'));
                            // $ele.find(iconClass).click();
                        }
                    }
                }

                // [For New Website (.pl)]: If section 'table', wait till table update, click body to close error popup and click "Proceed to checkout" from header's cart again to update edit order in table which not realtime likes old website
                if (section === 'table') {
                    cy.wait('@loadQuickview');
                    cy.wait(Cypress.env('WAIT_TIME'));
                    cy.get('body').click(0, 0);
                    cy.doActionInHeaderCart({ type: 'proceedToCheckout' });
                    cy.wait(Cypress.env('WAIT_TIME'));
                }
            });

        // Get qty box's element and check now input's value is equal editQty
        cy.get($mainElement)
            .find($findElement)
            .then($ele => {
                expect($ele.find(inputElement).val()).to.equal(editQty, `Input's qty is equel editQty`);
            });
    });
});

// ++++ "Add Product" Window Element ++++
// "Add Product" Window: Check product detail in "Add Product" Window is equal as order's detail value
// e.g. order = {..., name: 'Printed Dress', qty: '1', size: 'S', color: 'Orange', price: '26.00', editThisOrderQtyFrom: 'addToCartInput[2]',... totalOrder: '1', totalProducts: '16.51',totalShipping: '2.00', totalPrice: '18.51', totalTax: '0.00', totalCart: '18.51' }
Cypress.Commands.add('checkOrderDetailInAddProductWindow', (order) => {
    cy.get('#layer_cart ')
        .should('be.visible')
        .then($cart => {

            cy.wait(Cypress.env('WAIT_TIME'));
            // Loop check product detail from element value is equal order detail or not
            loopCheckOrderDetailFromElementValues($cart, 'addProductWindow', order);
        });
});

// "Add Product" Window: Close "Add Product" Window
Cypress.Commands.add('closedAddProductWindow', () => {
    cy.get('#layer_cart .layer_cart_product').find('.cross').click();
});

// "Add Product" Window: Do proceed to checkout from "Add Product" Window
Cypress.Commands.add('proceedToCheckoutFromAddProductWindow', () => {
    cy.get('#layer_cart .layer_cart_cart').find('a[title="Proceed to checkout"]').click();
});

// ++++ Header's Cart Element ++++
// Header Cart: Do action in header's cart which is 'proceedToCheckout', 'checkOrdersDetail' or 'deletedThisOrder', add css's style 'display: block' to 'cart_block' to show 'cart_block''s detail first
// e.g. options = { type: 'checkOrdersDetail', order: order }
Cypress.Commands.add('doActionInHeaderCart', (options) => {
    cy.get('.header-container .shopping_cart .cart_block')
        .invoke('attr', 'style', 'display: block')
        .then($cart => {

            const { order } = options;
            console.log(order)

            if (options['type'] === 'proceedToCheckout') {
                // Proceed to checkout : Click button's 'Proceed to checkout' from header's cart
                cy.get($cart).find('.cart-buttons #button_order_cart').click();
            } else if (options['type'] === 'deletedThisOrder') {

                // Deleted this order: Deleted this order from header's cart find deleted dt's index by deletedRowId' which set from this order's detail
                // Note: Need to set deletedRowId when get test case from excel by checking order's index from nowOrderLists in case dynamic test mutiple time add and deleted order
                // e.g. deletedRowId = 0
                cy.get($cart)
                    .find('dl.products dt')
                    .eq(order['deletedRowId'])
                    .then($dt => {
                        cy.get($dt).find('.ajax_cart_block_remove_link').click();
                    });

            } else if (options['type'] === 'checkOrdersDetail') {

                // Check orders detail: Check all order's detail in header's cart
                if (order['nowOrderLists'].length === 0) {
                    // Check order: If no order (cart is empty) then shouldn't cart's header total order's qty shouldn't visible and element dl's products shouldn't exsist
                    cy.get($cart).parent().find('.ajax_cart_quantity').should('not.visible');
                    cy.get($cart).find('dl.products dt').should('not.exist');

                } else {

                    // [For New Website (.pl)]: Scroll down for video recording
                    cy.get('#header_logo').scrollIntoView();

                    // Check order: If header's cart has some order, check cart's header total order's qty 
                    cy.get($cart)
                        .parent()
                        .find('.ajax_cart_quantity')
                        .should('contain', order['totalOrder']);

                    // Check order: Loop element dl's products for checking all orders in cart by nowOrderLists 
                    cy.get($cart)
                        .find('dl.products dt')
                        .each(($dt, i) => {
                            // Check order: Loop check product detail from element value is equal order detail or not
                            loopCheckOrderDetailFromElementValues($dt, 'headerCart', order['nowOrderLists'][i])
                        });
                }

                // Check order: Check cart's header total
                cy.get($cart).then(() => {
                    // Check order: Loop check product detail from element value is equal order detail or not
                    loopCheckOrderDetailFromElementValues($cart, 'headerCartTotal', order)
                })

                // Hide 'cart_block''s detail back
                cy.get($cart).invoke('attr', 'style', 'display: none');
            }
        })
});

// ++++ SHOPPING-CART Page Element ++++
// SHOPPING-CART-01: Do action in SHOPPING-CART table which is ''checkOrdersDetail', 'deletedThisOrder' or 'editThisOrder'
// e.g. options = { type: 'checkOrdersDetail', order: order }
Cypress.Commands.add('doActionInShoppingCartSummaryTable', (options) => {

    const { order } = options;
    const $tableId = 'table#cart_summary';
    console.log(order)

    if (options['type'] === 'checkOrdersDetail') {

        // Check orders detail: Check all order's detail in SHOPPING-CART table
        if (order['nowOrderLists'].length === 0) {
            // Check order: If no order (cart is empty) then SHOPPING-CART table shouldn't exsist
            cy.get($tableId).should('not.exist');
        } else {

            // [For New Website (.pl)]: Scroll down for video recording
            cy.get('#header_logo').scrollIntoView();

            // Check order: If header's cart has some order, check cart's header total order's qty 
            cy.get($tableId)
                .then($table => {
                    // Loop check all orders detail from table value is equal order detail or not
                    loopCheckOrderDetailFromTableValues($table, 'shoppingCartSummaryTbody', order['nowOrderLists']);

                    loopCheckOrderDetailFromElementValues($table, 'shoppingCartSummaryTfoot', order)
                });
        }

    } else if (options['type'] === 'deletedThisOrder') {

        // Deleted this order: Deleted this order from SHOPPING-CART table find deleted tr's index by deletedRowId' which set from this order's detail to click delete button
        // Note: Need to set deletedRowId when get test case from excel by checking order's index from nowOrderLists in case dynamic test mutiple time add and deleted order
        // e.g. deletedRowId = 0
        cy.get($tableId)
            .find('tbody tr')
            .eq(order['deletedRowId'])
            .then($tr => {
                cy.get($tr).find('td.cart_delete .cart_quantity_delete').click();
            });

    } else if (options['type'] === 'editThisOrder') {
        // Edit this order: Edit order's qty which can edit from 2 sections 1. From product detail page 2. SHOPPING-CART Summary page concept of edit qty both sections are same but different element's name, set value as array in case want to loop increase or decrease product's qty 
        // Note: Need to set editRowId when get test case from excel by checking order's index from nowOrderLists in case dynamic test mutiple time add and edit order
        // e.g. editRowId = 0
        // cy.get($tableId)
        //     .find('tbody tr')
        //     .eq(order['editRowId'])
        //     .find('td.cart_quantity')
        //     .then($td => {
        //         // Quantity: Edit product's qty by.Input or Click icon
        //         cy.editProductQtyFromInputOrIcon(order['editThisOrderQtyFrom'], '#order-detail-content', $td, 'table');
        //     });

        // [For New Website (.pl)]: Set full element instead of $td for case reload page which $td not work to find element by .eq()
        cy.editProductQtyFromInputOrIcon(order['editThisOrderQtyFrom'], '#order-detail-content', `table#cart_summary tbody tr:eq(${order['editRowId']}) td.cart_quantity`, 'table');

    }
});

// SHOPPING-CART-03.ADDRESS: Choose delivery address and billing address and checking both detail in each ul
// e.g. options = { deliveryAddress: testCaseDetail['deliveryAddress'], invoiceAddress: testCaseDetail['invoiceAddress'] }
Cypress.Commands.add('doActionInShoppingCartAddress', (options) => {

    const { deliveryAddress, invoiceAddress } = options;

    // SHOPPING-CART-03.ADDRESS: Choose a delivery address
    cy.get('#id_address_delivery').select(deliveryAddress['alias']);
    cy.wait(Cypress.env('WAIT_TIME'));

    // [For New Website (.pl)]: Add click body to close error popup, scroll down for video recording
    cy.get('body').click(0, 0);
    cy.get('#id_address_delivery').scrollIntoView();

    // SHOPPING-CART-03.ADDRESS: Choose a billing address
    if (invoiceAddress['alias'] !== deliveryAddress['alias']) {
        // If billing address is diferent from delivery address uncheck 'Use the delivery address as the billing address.' 
        cy.get(`input[type="checkbox"]#addressesAreEquals`).uncheck();
        cy.wait(Cypress.env('WAIT_TIME'));

        // [For New Website (.pl)]: Add click body to close error popup
        cy.get('body').click(0, 0);

        // Choose a invoice address from list
        cy.get('#id_address_invoice').select(invoiceAddress['alias']);
        cy.wait(Cypress.env('WAIT_TIME'));

        // [For New Website (.pl)]: Add click body to close error popup
        cy.get('body').click(0, 0);
    } else {
        // If billing address is same as delivery addrese, do nothing
    }

    // SHOPPING-CART-03.ADDRESS: Loop checking delivery address's detail in delivery address's ul
    loopCheckOrderDetailFromElementValues('', 'addressDeliveryAddressElement', deliveryAddress);

    // SHOPPING-CART-03.ADDRESS: Loop checking bill address's detail in bill address's ul
    loopCheckOrderDetailFromElementValues('', 'addressBillAddressElement', invoiceAddress);
});


// SHOPPING-CART-All STEP: Click button's 'Proceed to checkout' from each step
Cypress.Commands.add('proceedToCheckoutShoppingCartPage', () => {
    cy.get('.cart_navigation button[type="submit"]').click();
});


// ++++ ORDER HISTORY Page Element ++++
// Check order: If header's cart has some order, check cart's header total order's qty 
Cypress.Commands.add('doActionInOrderHistoryPage', (options) => {

    if (options['type'] === 'checkOrderReference') {
        loopCheckOrderDetailFromElementValues('', 'orderHistoryTbody', options['object']);

    } else if (options['type'] === 'showThisOrderDetail') {
        cy.get('table#order-list')
            .then($table => {
                cy.get($table).find('tbody tr:eq(0) td.history_detail a.button').click();
            });
    } else if (options['type'] === 'checkOrder') {

        loopCheckOrderDetailFromElementValues('', options['mainElementName'], options['object']);
        // loopCheckOrderDetailFromElementValues('', 'orderHistorySubmitReorder', options['object']);
    } else if (options['type'] === 'checkOrderTable') {
        loopCheckOrderDetailFromTableValues('', options['mainElementName'], options['object']);
    }
});
