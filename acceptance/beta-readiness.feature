Feature: Beta Readiness
  TraceMap beta v0.1 should support a complete investigation workflow with evidence-first outputs.

  Scenario: User can complete a beta investigation flow
    Given the user is on the TraceMap landing page
    When the user enters a research topic
    And the user starts the investigation
    Then a new analysis run should be created
    And the run page should display a mission header
    And the run page should display an investigation timeline
    And the run page should display an evidence map
    And the run page should display an unknown map
    And the run page should display source lineage information
    And the run page should display source quality information
    And the run page should display a briefing report preview
    And the user should be able to copy the briefing report markdown
    And the user should be able to download the briefing report markdown
    And the user should be able to create or access a read-only share link

  Scenario: Run detail page shows explicit state UI during mission lifecycle
    Given an investigation run is in progress
    When the user opens the run detail page or a read-only share page
    Then the page should show `run-loading-state`
    And the loading message should include one of:
      | COLLECTING SOURCES |
      | EXTRACTING CLAIMS |
      | LINKING EVIDENCE |
      | DETECTING UNKNOWNS |
      | BUILDING REPORT |
    And the loading message should include a Japanese explanation

  Scenario: Run detail page shows explicit error and empty states
    Given an investigation run fails or has no generated snapshot yet
    When the user opens the run detail page or a read-only share page
    Then the page should show `run-error-state` when the run failed
    And the error message should include `RUN FAILED`
    And the page should show `run-empty-state` when summary content is empty
    And the page should show `source-empty-state` when source list is empty
    And `unknown-empty-state` should remain consistent with the unknown map panel wording

  Scenario: User can revisit a saved investigation
    Given at least one analysis run exists
    When the user opens the saved investigations page
    Then the user should see previous analysis runs
    And each completed run should link to its run detail page
