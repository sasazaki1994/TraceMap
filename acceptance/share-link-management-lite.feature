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

  Scenario: User revokes a share link
    Given an active share link exists
    When the user revokes the share link
    Then the share link should be marked expired
    And the public share page should no longer show the run content for that token

  Scenario: Expired share link is not publicly readable
    Given a share link is expired
    When someone opens the share URL
    Then the public share page should not display the run content
