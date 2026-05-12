Feature: Unknown Map Categorization and Deduplication

  Scenario: Unknown map categorizes unresolved issues
    Given an analysis run has completed
    When the run contains weakly supported claims or source quality issues
    Then the unknown map should show categorized unknowns
    And each unknown should show severity
    And each unknown should show reason
    And each unknown should show suggested next action


  Scenario: Unknown map suppresses duplicates by category and related ids
    Given multiple unknowns have identical category and related claim/source ids
    When the unknown map is generated
    Then duplicate unknowns should be merged into a single entry

  Scenario: Unknown entries include relation fields
    Given an analysis run has completed
    When unknown map entries are built
    Then each unknown should include relatedClaimIds
    And each unknown should include relatedSourceIds

  Scenario: Unknown map can classify comparison and scope gaps
    Given an analysis run has comparison or scope evidence gaps
    When the unknown map is generated
    Then unknown category should include comparison when relevant
    And unknown category should include scope when relevant
