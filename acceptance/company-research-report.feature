Feature: Company Research Report Mode

  Scenario: User starts a company research investigation
    Given the user is on the TraceMap landing page
    When the user enters a company research topic
    And the user starts the investigation
    Then a new analysis run should be created
    And the run page should display a mission header
    And the run page should display an evidence map
    And the run page should display an unknown map
    And the run page should display source lineage information
    And the run page should display a company research report preview

  Scenario: Company research report shows business analysis sections
    Given an analysis run has completed
    When the run page renders the company research report section
    Then the report should include a company overview
    And the report should include business segments or focus areas
    And the report should include growth drivers
    And the report should include risk factors
    And the report should include competitive or market context
    And the report should include recent developments
    And the report should include supporting sources
    And the report should include unknowns or open questions

  Scenario: Company research report avoids investment advice
    Given an analysis run has completed
    When the company research report is displayed
    Then the report should not include buy recommendations
    And the report should not include sell recommendations
    And the report should not assert a target stock price
    And the report should not guarantee future performance
    And the report should include a neutral research disclaimer when investment-related language is present
