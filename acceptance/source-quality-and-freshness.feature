Feature: Source Quality and Freshness Inspector

  Scenario: Run page shows source quality labels
    Given an analysis run has completed
    When the run page displays sources
    Then each source should show a quality label
    And each source should show a freshness label
    And each source should show a reachability label
    And each source should show at least one reason for the assessment

  Scenario: Unknown or unchecked sources are not shown as verified
    Given an analysis run has completed
    When a source has missing publication date or unchecked reachability
    Then the source should not be displayed as verified
    And the source should show Unknown or Unchecked status

  Scenario: Official or primary-looking sources are visually distinguishable
    Given an analysis run has completed
    When a source is marked as primary or official-looking
    Then the source quality panel should show that status
    And the source should still show freshness and reachability separately

  Scenario: Stale sources are distinguishable
    Given an analysis run has completed
    When a source has an old publication date
    Then the source should show Stale freshness
    And the source should include a reason explaining the stale assessment
