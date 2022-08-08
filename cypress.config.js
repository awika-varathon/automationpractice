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
        "WAIT_TIME": 5000
    },
    viewportWidth: 1440,
    viewportHeight: 780, 
    defaultCommandTimeout: 5000,
    responseTimeout: 50000,
    requestTimeout: 50000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        setOrderReferenceDetail: (val) => {
          return (href = val)
        },
        getOrderReferenceDetail: () => {
          return href
        },
      })
    },
  },
});
