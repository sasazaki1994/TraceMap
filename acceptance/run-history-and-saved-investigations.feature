Feature: Run History and Saved Investigations

Scenario: User views saved investigations
  Given one or more analysis runs exist
  When the user opens the run history page
  Then the page should display a saved investigations heading
  And the page should list analysis runs in reverse chronological order
  And each run item should show the research topic
  And each run item should show the run status
  And each run item should show created and updated timestamps
  And each run item should link to the run detail page

Scenario: User filters saved investigations by status
  Given analysis runs exist with different statuses
  When the user selects a completed status filter
  Then only completed runs should be shown
  And the selected filter should be visible

Scenario: User searches saved investigations by topic
  Given multiple analysis runs exist
  When the user searches by a topic keyword
  Then runs whose research topic includes the keyword should be shown
  And unrelated runs should be hidden

Scenario: User sees an empty history state
  Given no analysis runs exist
  When the user opens the run history page
  Then an empty saved investigations message should be displayed
  And the page should provide a link to start a new investigation

Scenario: User sees failed run details in history
  Given a failed analysis run exists with an error message
  When the user opens the run history page
  Then the failed run should show its error message
  And the failed run should still link to the run detail page
