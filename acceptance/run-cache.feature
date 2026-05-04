Feature: Run Cache
  Scenario: Completed investigation result is stored in run cache
    Given a provider returns a valid completed investigation payload
    When an analysis run is completed
    Then a run cache entry should be created
    And the cache entry should store the normalized payload
    And the cache entry should store the provider id and cache key metadata

  Scenario: Fresh run cache entry is reused
    Given a fresh run cache entry exists for the same research topic and provider configuration
    When the user starts the same investigation again
    Then the provider should not be called again
    And a new analysis run should still be created
    And the new run should have its own answer and source snapshots

  Scenario: Stale run cache entry is not reused
    Given a stale run cache entry exists
    When the user starts the same investigation again
    Then the provider should be called
    And the run cache entry should be refreshed after successful completion

  Scenario: Failed provider result is not cached
    Given the provider returns a failure result
    When an analysis run is created
    Then the run should be marked as failed
    And no run cache entry should be created for that failed result

  Scenario: Cache hit preserves Evidence Map consistency
    Given a fresh run cache entry exists
    When a new run is created from the cache
    Then the graph source nodes should point to the new run-local source snapshot ids
    And claim-source relations should point to the new run-local source snapshots
