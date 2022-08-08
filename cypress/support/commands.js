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
import {covertOrderListValueCondition} from '../support/util'

// ++++ Visit ++++
// Visit: Visit catagory or sub catagory page
Cypress.Commands.add('visitCatagoryPage', (catagotyName) => {
    console.log(`Visit Catagory Page - ${catagotyName}`);
    const pageLink = {
        dresses: 'id_category=8&controller=category',
        women: 'id_category=3&controller=category',
        tshirt: 'id_category=5&controller=category',
        blouses: 'id_category=7&controller=category'
    }
    cy.visit(Cypress.env('BASE_URL') + pageLink[catagotyName.toLowerCase()], {failOnStatusCode: false});
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

    // checkMyAccountLogin();
});

// ++++ Header User Element ++++
// Header: Login in from header
Cypress.Commands.add('loginFromHeader', () => {
    cy.get('.header_user_info .login').click();
    cy.loginMyAccount();
});

// Header: Check that login correctly from header's user info is changed from 'Sign in' to 'USER_NAME' 
Cypress.Commands.add('checkMyAccountLogin', () => {
    cy.get('.header_user_info .account span')
        .should(($account) => {
            expect($account).to.contain(Cypress.env('USER_NAME'));
    }); 
});

// Header: Click username from header to my account page
Cypress.Commands.add('clickToMyAccountPage', () => {
    cy.get('.header_user_info .account span').click();
});

// ++++ Header Menu Element ++++
// Header Menu: Click header menu to catagory page
Cypress.Commands.add('clickToCatagoryPageFromMenu', (menuName) => {
    console.log(`To product's page from: Click header menu - ${menuName}`);
    cy.get(`#block_top_menu > ul > li > a[title="${menuName}"]`).click({force: true});
});

// ++++ Card Order Element ++++
// Card: Find product card by order's name, add class 'hovered' to closest 'li' to view more product details and buttons. Then click 'Add to cart' to add this product to cart or view more detail by click 'quickview' or 'more' select order's detail before add this product to cart 
Cypress.Commands.add('findAndSelectProductFromCard', (orderList) => {
    cy.contains(`ul.product_list > li > .product-container .product-name`, orderList['name'])
    .closest('li')
    .invoke('addClass', 'hovered')
    .then($li => {
        switch (orderList['addToCartFrom']) {
            case 'card':
                // Card: Click 'Add to cart' 
                cy.get($li).find(`.button-container a[title="Add to cart"]`).click();
                break;
            case 'quickview':
                // Card: Click 'Quickview' and select product from orderList
                cy.get($li).find(`.quick-view`).click();
                // cy.wait(20000)
                cy.wait('@loadQuickview')
                cy.selectedProductFromProductDetail(orderList);
                break;
            case 'more':
                // Card: Click 'more' and select product from orderList
                cy.get($li).find(`.button-container a[title="View"]`).click();
                cy.selectedProductFromProductDetail(orderList);
                break;
        } 
    });
});


// ++++ Selected Product Detail Element (Note: Quick View & Product Detail has same element) ++++
// Product Detail: Selected product quantity, size and color in product detail's part then add to cart
// e.g. orderlist = {..., name: 'Printed Dress', quantity: '1', size: 'S', color: 'Orange', price: '26.00', editThisOrderQtyFrom: 'addToCartInput[2]' || }
Cypress.Commands.add('selectedProductFromProductDetail', (orderList) => {
    // Card: 
    cy.get(`.primary_block`)
        .find('form#buy_block')
        .then($form => {

            // // Quantity: Edit product's qty by.Input or Click icon
            cy.editProductQtyFromInputOrIcon(orderList['editThisOrderQtyFrom']);

            // Size: Select size by.select option
            cy.get($form).find(`.attribute_list select`).select(orderList['size']);

            // // Color: Select color by click a which title is same as color 
            cy.get($form).find(`ul#color_to_pick_list a[title=${orderList['color']}]`).click();
            cy.wait(Cypress.env('WAIT_TIME'));

            // Button: Click 'Add to cart' and wait for response
            cy.get($form).find(`.box-cart-bottom button[name="Submit"]`).click();
            cy.wait('@loadQuickview')
    });
});


// Edit product's qty which can edit from 2 sections 1. From product detail page 2. SHOPPING-CART Summary page concept of edit qty both sections are same but different element's name, set value as array in case want to loop increase or decrease product's qty 
// e.g. editThisOrderQtyFrom: ['productDetailInput[2]', 'productDetailIcon[2]', 'shopingCartSummaryInput[1]', 'shopingCartSummaryIcon[2]'] 
Cypress.Commands.add('editProductQtyFromInputOrIcon', (editThisOrderQtyFrom) => {
    
    // Loop edit product's qty from setting in each value
    editThisOrderQtyFrom.forEach(editThisOrder => {

        cy.log(`Edit this order qty from: ${editThisOrder}`);

        // Check editThisOrder's value if includes 'productDetail' means edit Qty from product detail's page set qty box's element's name as '#quantity_wanted_p' else set element's name as '.cart_quantity'
        const qtyElement = editThisOrder.includes('productDetail') ? '#quantity_wanted_p' : '.cart_quantity';

        // orderListValue: Split and replace orderListValue to return value of condition as editQty
        // e.g. editQty = 'productDetailInput[2]' => '2'
        const editQty = covertOrderListValueCondition(editThisOrder)
        
        // Get qty box's element
        cy.get(qtyElement)
            .then($ele => {

                // Find input's value first as nowQty checking if nowQty equel editQty do not edit
                const nowQty = $ele.find(`input`).val();
                if(nowQty !== editQty) {
                    if(editThisOrder.includes('Input')) {
                        // If editThisOrder includes 'Input', edit product's qty from input
                        cy.log(`Edit this order qty by. Input`);
                        $ele.find(`input`).val(editQty);
                    } else if(editThisOrder.includes('Icon')) {
                        // If editThisOrder includes 'Icon', edit product's qty from click icon
                        // Check if editQty > nowQty set button's class as '.button-plus' else '.button-minus' and loop click from result of editQty minus nowQty convert to possive number only by function Math.abs
                        // e.g. editQty(1)-nowQty(3) => -2 => 2)
                        cy.log(`Edit this order qty by. Click Icon`);
                        const iconClass = editQty > nowQty ? '.button-plus' : '.button-minus';
                        for(let i = 0; i < Math.abs(editQty-nowQty); i++) {
                            $ele.find(iconClass).click();
                        }
                    }
                    // Check now input's value  is equal editQty
                    expect($ele.find(`input`).val()).to.equal(editQty);
                }
        });
    }); 
});