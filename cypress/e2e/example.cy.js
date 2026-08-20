// https://docs.cypress.io/api/introduction/api.html

describe('app shell', () => {
  it('server-renders the header and search box', () => {
    cy.visit('/')
    cy.contains('TIDY').should('be.visible')
    cy.get('input[placeholder]').should('exist')
  })

  it('never ships the WeatherAPI key or calls the upstream host directly', () => {
    cy.intercept('https://api.weatherapi.com/**', (req) => {
      throw new Error(`client called WeatherAPI directly: ${req.url}`)
    })
    cy.visit('/')
    cy.document().its('documentElement.outerHTML').should('not.contain', 'weatherapi.com/v1')
  })
})
