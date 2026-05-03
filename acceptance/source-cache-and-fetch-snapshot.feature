Feature: Source Cache and Fetch Snapshot
  Scenario: Source URL is normalized before cache lookup
    Given a provider returns a valid http source URL
    When the source is persisted
    Then the URL should be normalized for cache lookup
    And the original URL should remain available for audit display

  Scenario: Fresh source cache entry is reused
    Given a source cache entry exists and is still fresh
    When another run uses the same normalized URL
    Then the existing cache entry should be reused
    And the source should not be fetched again unnecessarily

  Scenario: Missing or stale source cache entry is fetched
    Given no fresh source cache entry exists for a valid URL
    When a run is persisted with that URL
    Then a source fetch snapshot should be created
    And the source cache entry should be updated

  Scenario: Unsafe source URL is not fetched
    Given a provider returns a localhost or private network URL
    When the source verification step runs
    Then the URL should not be fetched
    And the source should be marked as invalid or unreachable
    And the run should not crash

  Scenario: Source snapshot receives verification metadata
    Given a run is persisted with a valid source URL
    When source cache or fetch metadata is available
    Then the run-local source snapshot should store verification status
    And the run-local source snapshot should store http status when available
    And the run-local source snapshot should store final URL when available
    And the run-local source snapshot should store content type when available
