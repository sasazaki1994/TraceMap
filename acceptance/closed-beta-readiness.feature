Feature: Closed Beta Readiness

  Scenario: User can understand TraceMap value from the landing page
    Given the user is on the TraceMap landing page
    Then the page should explain that TraceMap traces evidence behind AI findings
    And the primary input should be labeled as a research topic or investigation topic
    And the primary action should start an investigation

  Scenario: Completed run shows the investigation console
    Given an analysis run has completed
    When the user opens the run page
    Then the page should display a mission header
    And the page should display an evidence map
    And the page should display an unknown map
    And the page should display source lineage information
    And the page should display a briefing report preview

  Scenario: User can reuse the briefing report
    Given an analysis run has completed
    When the user views the briefing report
    Then the report should be displayed as Markdown
    And the user should be able to copy the Markdown
    And the user should be able to download the Markdown as a .md file

  Scenario: User can inspect how a source supports claims
    Given an analysis run has completed
    When the user opens a source detail panel
    Then the panel should show the source title
    And the panel should show source metadata when available
    And the panel should show related claims
    And the panel should show supporting quotes when available
    And the panel should not mark unverified sources as verified

  Scenario: Unknown map communicates unresolved gaps
    Given an analysis run has completed
    When the run contains alerts or weakly supported claims
    Then the unknown map should list unresolved gaps
    And each gap should show a severity
    And each gap should show a reason
    And each gap should show a suggested next action
