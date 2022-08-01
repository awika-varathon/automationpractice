const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://automationpractice.com/index.php?",
    env: {
        "BASE_URL": "http://automationpractice.com/index.php?",
        "FORM_AUTH": "controller=authentication",
        "MY_ACCOUNT_URL": "controller=my-account",
        "EMAIL": "automated.test@mail.com",
        "PASSWORD": "automatedTest",
        "USER_NAME": "Automated Test",
    },
    viewportWidth: 1440,
    viewportHeight: 780, 
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
