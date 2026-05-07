Feature: Investigation Mode
  As someone starting a research workflow
  I want TraceMap to treat my input as an investigation topic
  So that I can review findings, evidence, unknowns, lineage, and a briefing report together

  Background:
    Given the TraceMap application is running
    And the database is migrated and reachable via DATABASE_URL

  Scenario: User starts an investigation from a research topic
    Given the user is on the TraceMap landing page
    When the user enters a research topic
    And the user starts the investigation
    Then a new analysis run should be created
    And the run page should display a mission header
    And the run page should display an investigation guide
    And the run page should display an investigation timeline
    And the run page should display an executive summary
    And the run page should display an evidence map
    And the run page should display an unknown map
    And the run page should display source lineage information
    And the run page should display a briefing report preview
