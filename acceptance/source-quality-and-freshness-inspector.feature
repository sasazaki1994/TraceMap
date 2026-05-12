Feature: Source Quality and Freshness Inspector

  Scenario: Completed run shows source quality labels
    Given an analysis run has completed
    When the user views the run page
    Then each source should show a quality label when quality can be derived
    And each source should show a freshness label when publication or checked date is available
    And each source should show a reachability label when fetch or verification status is available
    And unknown values should be displayed as unknown or unchecked

  Scenario: Source detail explains quality reasons
    Given an analysis run has completed
    When the user opens a source detail panel
    Then the panel should show the source quality label
    And the panel should show reasons for the quality label
    And the panel should show freshness information
    And the panel should show reachability information
    And the panel should not claim that the source is verified unless verification data exists

  Scenario: Unknown map includes source quality gaps
    Given an analysis run has completed
    When a source has unknown freshness or weak quality indicators
    Then the unknown map should include a source quality related gap
    And the gap should show a reason
    And the gap should show a severity
    And the gap should show a suggested next action

  Scenario: Briefing report includes source quality summary
    Given an analysis run has completed
    When the briefing report is generated
    Then the report should include a Source Quality Summary section
    And the section should summarize strong, limited, weak, and unknown sources
    And the report should not overstate source reliability
