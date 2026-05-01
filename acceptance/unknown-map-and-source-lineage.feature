Feature: Unknown Map and Source Lineage Lite
  As someone reviewing an investigation result
  I want to see unresolved gaps and source provenance
  So that I can decide what needs verification before reuse

  Background:
    Given the TraceMap application is running

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
