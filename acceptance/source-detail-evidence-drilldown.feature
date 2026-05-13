Feature: Source Detail Evidence Drilldown

  Scenario: User opens a source detail panel
    Given an analysis run has completed
    When the user opens a source detail panel
    Then the panel should show the source title
    And the panel should show the source URL
    And the panel should show source quality information
    And the panel should list claims supported by that source

  Scenario: Source detail shows claim support information
    Given an analysis run has completed
    When a source supports one or more claims
    Then each supported claim should show its support kind
    And each supported claim should show a supporting quote when available
    And claims without supporting quotes should not be displayed as directly quoted evidence

  Scenario: Source detail shows contradiction notes
    Given an analysis run has completed
    When a source relationship has a contradiction note
    Then the source detail panel should display the contradiction note
    And the contradiction note should be visually distinguishable from normal support

  Scenario: Source detail shows primary source and lineage context
    Given an analysis run has completed
    When a source is primary or official-looking
    Then the source detail panel should show a primary source badge
    And the panel should show lineage information when available
    And unchecked sources should not be displayed as verified

  Scenario: Source detail shows related unknowns
    Given an analysis run has completed
    When unknowns or warnings are related to a source
    Then the source detail panel should list related unknowns
    And each related unknown should show a reason or next action when available
