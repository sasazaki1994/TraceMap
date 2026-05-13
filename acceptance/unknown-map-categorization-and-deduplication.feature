Feature: Unknown Map Categorization and Deduplication

  Scenario: Unknown map shows categorized unresolved issues
    Given an analysis run has completed
    When the run contains alerts or weakly supported claims
    Then the unknown map should show categorized unknowns
    And each unknown should show a severity
    And each unknown should show a reason
    And each unknown should show a suggested next action

  Scenario: Unknown map includes source quality issues
    Given an analysis run has completed
    When a source is stale, unchecked, invalid, unreachable, limited, or weak
    Then the unknown map should include a source-related unknown
    And the unknown should explain why the source requires attention

  Scenario: Unknown map includes evidence support issues
    Given an analysis run has completed
    When a claim has weak support or missing supporting quotes
    Then the unknown map should include an evidence-related unknown
    And the unknown should suggest checking stronger or direct evidence

  Scenario: Unknown map includes contradiction issues
    Given an analysis run has completed
    When a source relationship has a contradiction note
    Then the unknown map should include a contradiction-related unknown
    And the contradiction should be visually distinguishable

  Scenario: Duplicate unknowns are merged
    Given multiple alerts or derived issues refer to the same claim, source, and category
    When the unknown map is generated
    Then duplicate unknowns should be merged
    And the merged unknown should preserve the strongest severity
    And the merged unknown should preserve related claim and source references

  Scenario: Empty unknown map is still informative
    Given an analysis run has completed
    When no unresolved unknowns are detected
    Then the unknown map should show an empty state
    And the empty state should not imply that the answer is fully verified
