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
