Feature: Unknown Map and Source Lineage Lite
  As someone reviewing an investigation result
  I want to see unresolved gaps and source provenance
  So that I can decide what needs verification before reuse

  Background:
    Given the TraceMap application is running
    And the database is migrated and reachable via DATABASE_URL

  Scenario: Run page shows unresolved investigation gaps
    Given an analysis run has completed
    When the run contains alerts or weakly supported claims
    Then the unknown map should list unresolved questions or gaps
    And each item should show a reason
    And each item should show a severity
    And each item should show a suggested next action

  Scenario: Run page shows source lineage lite
    Given an analysis run has completed
    When source snapshots are displayed
    Then each source should show a lineage label
    And primary or official-looking sources should be visually distinguishable
    And unverified or unknown sources should not be shown as verified

  Scenario: Shared view preserves unknown map and source lineage
    Given an analysis run has completed
    And a share link exists for the run
    When the shared read-only page is opened
    Then the shared page should display the unknown map
    And the shared page should display source lineage information
