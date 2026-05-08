Feature: Run History and Saved Investigations

  Scenario: User views saved investigations
    Given one or more analysis runs exist
    When the user opens the saved investigations page
    Then the page should list recent investigation runs
    And each item should show the research topic
    And each item should show the run status
    And each item should link to the run detail page

  Scenario: Completed run shows investigation summary metadata
    Given a completed analysis run exists
    When the user opens the saved investigations page
    Then the run item should show the latest answer title
    And the run item should show source count
    And the run item should show claim count
    And the run item should show alert count

  Scenario: Failed run shows failure information
    Given a failed analysis run exists
    When the user opens the saved investigations page
    Then the run item should show failed status
    And the run item should show the last error message
    And the run item should still link to the run detail page
