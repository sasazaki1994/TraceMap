Feature: Source detail and sharing
  As someone reviewing an analysis run
  I want to copy a share URL for the run
  So that others can view the same answer and sources read-only

  Background:
    Given the TraceMap application is running
    And the database is migrated and reachable via DATABASE_URL

  Scenario: Run page offers share action
    Given I have opened a completed run page at "/runs/{id}"
    When I choose to create a share link
    Then I should see a share URL containing "/share/"
    And the share URL region should be available for automation with "share-url"

  Scenario: Share URL shows read-only run content
    Given a valid share token exists for an analysis run
    When I open "/share/{token}"
    Then I should see the run question text
    And I should see the answer region
    And I should see the graph region
    And I should see at least one source row

  Scenario: Select source on share page updates detail panel
    Given I am viewing "/share/{token}" with multiple sources
    When I select the first source from the list
    Then the source detail panel should show that source label
