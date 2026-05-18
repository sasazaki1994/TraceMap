Feature: Public Beta Readiness
  TraceMap beta v0.1 should support a complete investigation workflow with evidence-first outputs.

  Scenario: User can complete a beta investigation flow
    Given the user is on the TraceMap landing page
    And the landing page indicates Public Beta positioning
    And investigation start requires sign-in
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
    And the share page should be read-only and non-indexable

  Scenario: User can revisit a saved investigation
    Given at least one analysis run exists
    When the user opens the saved investigations page
    Then the user should see previous analysis runs
    And each completed run should link to its run detail page

  Scenario: Briefing report contains public beta disclaimer
    Given a completed investigation run is visible
    Then the briefing report markdown should include a beta notice
    And the briefing report should state that TraceMap does not provide investment, legal, or medical advice


  Scenario: Launch and operation documents are available
    Given maintainers are preparing Public Beta launch decision
    Then a launch checklist document should exist
    And a final validation template should exist
    And an operations runbook should exist
    And the OpenAI smoke test plan should include pre-run and triage guidance
