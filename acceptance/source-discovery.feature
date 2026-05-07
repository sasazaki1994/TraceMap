Feature: Source Discovery
  As a TraceMap investigation user
  I want TraceMap to discover likely source candidates from my research topic
  So that investigations can proceed even when I do not paste URLs

  Scenario: Source discovery is disabled by default
    Given source discovery provider is not configured
    When a user starts an investigation
    Then the existing manual URL intake behavior should be preserved
    And the run should not require discovered sources to complete

  Scenario: Mock source discovery returns deterministic source candidates
    Given the source discovery provider is set to mock
    When a user starts an investigation without URLs
    Then TraceMap should request discovered source candidates for the research topic
    And discovered source URLs should be normalized and deduplicated
    And valid discovered sources should be passed to the answer graph provider as source candidates

  Scenario: Manual URLs are prioritized over discovered URLs
    Given the research topic contains manual URLs
    And source discovery also returns URLs
    When source candidates are built
    Then manual URL candidates should appear before discovered candidates
    And duplicate URLs should appear only once

  Scenario: Discovery failures do not fail the investigation
    Given the source discovery provider returns a failure
    When a user starts an investigation
    Then the investigation should continue with any manually supplied URL candidates
    And the discovery failure should be recorded as ignored source information

Scenario: Brave source discovery returns normalized candidates
  Given the source discovery provider is configured as "brave"
  And the Brave API key is configured
  When source discovery runs for a research topic
  Then the provider should return search_provider candidates
  And each candidate should have an http or https URL
  And duplicate URLs should be removed
  And no more than the requested max results should be returned

Scenario: Brave source discovery fails safely without API key
  Given the source discovery provider is configured as "brave"
  And the Brave API key is missing
  When source discovery runs for a research topic
  Then the provider should return a failure result
  And the analysis intake should not throw
  And the failure should be recorded as an ignored discovery source

