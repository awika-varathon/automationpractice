/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.ts can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
const fs = require('fs')
const {loadDBPlugin} = require('./db-plugin');
const readXlsx = require('./read-xlsx')
let tempVariables = {}


module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
    on('task', {
        ...loadDBPlugin(),
        clearConversionMISFolder() {
            const conversionMISdirectory = 'cypress/fixtures/conversion-mis'
            console.log('clearing folder %s', conversionMISdirectory)

            fs.rmdirSync(conversionMISdirectory, { recursive: true })

            return null
        },
        clearDownloads () {
            console.log('clearing folder %s', downloadDirectory)

            fs.rmdirSync(downloadDirectory, { recursive: true })

            return null
        },
        // Be careful when to use this as the temp variable is preserved across the spec file but the cookie is not
        // Ex. If we store the username variable in temp, when the spec file changed, the username will be there but cookie does not so it cannot login if we check the login state by this temp variable
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
}
