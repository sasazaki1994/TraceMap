Feature: Source Detail Evidence Drilldown

  Scenario: User opens a source detail view
    Given an analysis run has completed
    When the user opens a source detail panel
    Then the panel should list claims supported by that source
    And each supported claim should show its support kind
    And supporting quotes should be displayed when available
    And primary source status should be displayed when available
    And contradiction notes should be displayed when available
