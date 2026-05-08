Feature: Manual Source URL Intake

  Scenario: User starts an investigation with optional source URLs
    Given the user is on the TraceMap landing page
    When the user enters a research topic
    And the user enters one or more source URLs
    And the user starts the investigation
    Then a new analysis run should be created
    And manual source URLs should be passed into source intake
    And manual source URLs should be prioritized over discovered sources
    And the run page should display the investigation result

  Scenario: User enters duplicate source URLs
    Given the user is on the TraceMap landing page
    When the user enters duplicate source URLs
    And the user starts the investigation
    Then duplicate URLs should be removed before source intake
    And the run should not fail because of duplicates

  Scenario: User enters an invalid source URL
    Given the user is on the TraceMap landing page
    When the user enters an invalid source URL
    And the user starts the investigation
    Then the form should show a clear validation error
    And no broken analysis run should be created
