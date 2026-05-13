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
    And the run page should display run metadata
    And the run page should display usage meter lite
    And the run page should display an unknown map
    And the run page should display source lineage information
    And the run page should display a briefing report preview

  Scenario: Run page renders all Answer Graph v3 node kinds
    Given an analysis run has an Answer Graph v3 payload
    When the run page displays the evidence map
    Then question nodes should be visible
    And answer nodes should be visible
    And source nodes should be visible
    And claim nodes should be visible
    And counterclaim nodes should be visible
    And interpretation nodes should be visible
    And answer segment nodes should be visible

  Scenario: User can still select sources and claims in a v3 graph
    Given an analysis run has an Answer Graph v3 payload
    When the user selects a source node
    Then the source detail panel should show that source
    When the user selects a claim node
    Then linked sources should be highlighted

