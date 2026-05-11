Feature: Source Quality and Freshness Inspector

  Scenario: Completed run displays source quality information
    Given an analysis run has completed
    When the run page displays sources
    Then each source should show a quality label
    And each source should show a freshness label
    And each source should show a reachability label when available
    And each source should show a reason for the quality assessment

  Scenario: Weak or stale sources appear in the unknown map
    Given an analysis run has completed
    When a source is stale, unreachable, invalid, or has unknown freshness
    Then the unknown map should include a related investigation gap
    And the gap should show a suggested next action

  Scenario: Briefing report includes source quality summary
    Given an analysis run has completed
    When the briefing report is rendered
    Then the report should include a source quality summary
    And weak or stale sources should be identified without being shown as verified
