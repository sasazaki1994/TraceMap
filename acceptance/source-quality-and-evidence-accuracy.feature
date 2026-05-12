Feature: Source Quality and Evidence Accuracy

  Scenario: Run page shows source quality and freshness
    Given an analysis run has completed
    When the run page displays sources
    Then each source should show a quality label
    And each source should show a freshness label
    And each source should show a reachability label
    And each source should show a reason for the quality assessment
    And unknown sources should not be displayed as verified
