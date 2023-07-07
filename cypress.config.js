const { defineConfig } = require("cypress");
const readXlsx = require('./cypress/plugins/read-xlsx')

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://automationpractice.pl/index.php?",
    env: {
        "BASE_URL": "http://www.automationpractice.pl/index.php?",
        "FORM_AUTH": "controller=authentication",
        "MY_ACCOUNT_URL": "controller=my-account",
        "EMAIL": "automated.test@mail.com",
        "PASSWORD": "automatedTest",
        "USER_NAME": "Automated Test",
        "WAIT_TIME": 2000,
        commandDelay: false
    },
    viewportWidth: 1440,
    viewportHeight: 780, 
    defaultCommandTimeout: 20000,
    responseTimeout: 50000,
    requestTimeout: 50000,
    watchForFileChanges: false,
    chromeWebSecurity: false,
    videoCompression: 1,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        setOrderReferenceObject: (val) => {
          return (href = val)
        },
        getOrderReferenceObject: () => {
          return href
        },
        setTempVariable: ({ name, value }) => {
          tempVariables[name] = value
          return null
        },
        getTempVariable: ({ name }) => {
          return tempVariables[name] || null
        },
        clearTempVariables: () => {
          tempVariables = {}
          return null
        },
        'readXlsx': readXlsx.read
      })
    },
  },
});
