Feature: Investigation Depth Mode

Scenario: User starts a standard investigation by default
  Given the user is on the TraceMap landing page
  When the user enters a research topic
  And the user starts the investigation without changing the depth mode
  Then a new analysis run should be created
  And the selected investigation mode should be standard
  And the run cache key should include standard mode

Scenario: User starts a fast investigation
  Given the user is on the TraceMap landing page
  When the user enters a research topic
  And the user selects Fast mode
  And the user starts the investigation
  Then a new analysis run should be created with fast mode
  And provider generation should receive fast mode
  And output limits should use the fast profile

Scenario: User starts a deep investigation
  Given the user is on the TraceMap landing page
  When the user enters a research topic
  And the user selects Deep mode
  And the user starts the investigation
  Then a new analysis run should be created with deep mode
  And provider generation should receive deep mode
  And output limits should use the deep profile
