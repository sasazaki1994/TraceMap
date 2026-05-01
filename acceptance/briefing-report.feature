Feature: Briefing Report
  As someone sharing an investigation
  I want a reusable briefing preview
  So that I can copy the main findings, evidence, and open questions

  Background:
    Given the TraceMap application is running
    And the database is migrated and reachable via DATABASE_URL

  Scenario: User views a briefing report preview
    Given an analysis run has completed
    When the run page renders the briefing report section
    Then the report should include an executive summary
    And the report should include key claims
    And the report should include supporting sources
    And the report should include unresolved unknowns
    And the report should be displayed as Markdown text
