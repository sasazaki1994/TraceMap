Feature: Unknown Map Categorization and Deduplication

  Scenario: Unknown map categorizes unresolved issues
    Given an analysis run has completed
    When the run contains weakly supported claims or source quality issues
    Then the unknown map should show categorized unknowns
    And each unknown should show severity
    And each unknown should show reason
    And each unknown should show suggested next action
