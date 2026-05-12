Feature: Basic Auth and Owner Scope

Scenario: Unauthenticated user is asked to sign in before creating a run
  Given the user is not authenticated
  When the user visits the landing page
  Then the page should show a sign-in or beta access prompt
  And the user should not be able to create an analysis run without authentication

Scenario: Authenticated user creates an owned analysis run
  Given the user is authenticated
  When the user enters a research topic
  And the user starts the investigation
  Then a new analysis run should be created
  And the run should be owned by the current user

Scenario: Run history only shows the current user's investigations
  Given the user is authenticated
  And other users have analysis runs
  When the user opens the saved investigations page
  Then only the current user's runs should be listed

Scenario: Non-owner cannot open a private run detail page
  Given an analysis run belongs to another user
  When the current user opens the run detail URL directly
  Then the user should not see the private run result

Scenario: Owner can create and revoke share links
  Given the user owns an analysis run
  When the user creates a share link
  Then a public read-only share link should be created
  When the user revokes the share link
  Then the share link should no longer be active

Scenario: Public share link remains readable without authentication
  Given a share link exists for an analysis run
  When an unauthenticated user opens the share URL
  Then the shared run should be visible as read-only
  And no owner-only controls should be visible
