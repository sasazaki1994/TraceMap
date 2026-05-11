Feature: Source Quality and Freshness Inspector

Scenario: Run page shows source quality indicators
  Given an analysis run has completed
  When the run page displays source lineage information
  Then each source should show a reachability status
  And each source should show a freshness label
  And each source should show whether publication date is known
  And unverified sources should not be shown as verified

Scenario: Unknown Map includes source quality caveats
  Given an analysis run has completed
  When a source is unreachable or has unknown freshness
  Then the unknown map should include a source quality gap
  And the gap should show a reason
  And the gap should show a suggested next action

Scenario: Briefing Report includes source quality summary
  Given an analysis run has completed
  When the briefing report preview is rendered
  Then the report should include a source quality summary
  And the report should mention unreachable or stale sources when present
  And the report should not hide source quality limitations

Scenario: Run page shows dedicated source quality panel
  Given an analysis run has completed
  When the user opens the run detail page
  Then the source quality panel should be visible
  And source quality items should be listed when sources exist
