// import { groupBy, sumBy } from 'lodash';
// import * as _ from 'lodash'
// import moment = require('moment')


// const agencyReportConfigJSON = require(`/cypress/fixtures/golden-data/agencyReportConfig/agencyReportInfo.json`)


describe('Test e2e', () => {
        
    beforeEach(() => {
        cy.visit('/');
    })
  
    it('Test e2e', () => {

        // Order List
        const orderList = [
            { name: "Faded Short Sleeve T-shirts", quantity: "1", size: "S", color: "orange"}
        ]
        
        // Click to login page 
        cy.get('.header_user_info .login').click();

        // Login to my account
        loginMyAccount();

        // Back to index page 
        cy.visit('/');
   
        // cy.get('box-info-product')
        // cy.get(`${dialogFilter}`).should("be.visible");
    })
});

export const loginMyAccount = () => {

    const formAuth = `form[action="${Cypress.env('BASE_URL')}${Cypress.env('FORM_AUTH')}"]`;

    cy.get(`${formAuth}[id="login_form"] .form_content`).within(() => {
        cy.get('#email').type(Cypress.env('EMAIL'));
        cy.get('#passwd').type(Cypress.env('PASSWORD'));
        cy.get('#SubmitLogin').click();
    });

    checkMyAccountLogin();
}

export const checkMyAccountLogin = () => {
    cy.get('.header_user_info .account span').should(($account) => {
        expect($account).to.contain(Cypress.env('USER_NAME'));
    }); 
}