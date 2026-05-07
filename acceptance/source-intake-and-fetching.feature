Feature: Source Intake and Fetching v0.1
  As a TraceMap investigation user
  I want URLs in my research topic to be safely reused as compact source candidates
  So that provider generation can be grounded without unsafe fetches

  Scenario: Extract URLs from research topic
    Given a research topic containing multiple http and https URLs
    When source intake runs
    Then URL candidates are extracted from the text
    And trailing punctuation is removed

  Scenario: Reuse cache by normalized URL
    Given a normalized URL already exists in SourceCacheEntry with fresh successful fetch metadata
    When source intake runs for an equivalent URL variant
    Then the cache entry is reused without a new fetch

  Scenario: Block unsafe URL fetch
    Given a research topic containing localhost or private network URLs
    When source intake runs
    Then those URLs are ignored as unsafe
    And no network fetch is executed for them

  Scenario: Pass compact source candidates to provider input
    Given source intake produced candidates
    When provider generation starts
    Then GenerateAnswerGraphInput includes compact sourceCandidates
    And raw HTML全文 is not passed to provider

  Scenario: Continue run when fetch fails
    Given source fetch fails for one candidate URL
    When run generation continues
    Then the run does not fail immediately due only to fetch failure
    And the candidate includes fetch error metadata
