Feature: Report Export and Templates

  Scenario: User switches report templates
    Given an analysis run has completed
    When the user selects Company Research template
    Then the report should include company overview
    And the report should include growth drivers
    And the report should include risks
    And the report should include unknowns
    And the report should avoid investment advice language
