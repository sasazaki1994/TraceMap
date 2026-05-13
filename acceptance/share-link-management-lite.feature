Feature: Share Link Management Lite

  Scenario: User views existing share links for a run
    Given an analysis run has one or more share links
    When the user opens the run detail page
    Then the share panel should list existing share links
    And each share link should show its read-only URL
    And each share link should show its created date
    And each share link should show whether it is active or expired

  Scenario: User creates a new share link
    Given the user is on a run detail page
    When the user creates a share link
    Then a new read-only share URL should be displayed
    And the link should be listed in the share panel

  Scenario: User copies a share link URL
    Given an active share link exists on the run detail page
    When the user clicks the copy button for a share link
    Then the share link URL should be copied to the clipboard
    And the UI should show copied state feedback

  Scenario: User revokes a share link
    Given an active share link exists
    When the user revokes the share link
    Then the share link should be marked expired
    And the public share page should no longer show the run content for that token

  Scenario: Invalid or expired share link shows dedicated read-only invalid state
    Given a share link is invalid or expired
    When someone opens the share URL
    Then the public share page should show a dedicated invalid state message
    And the page should display the read-only badge
    And the page should state that edit and re-run are unavailable
