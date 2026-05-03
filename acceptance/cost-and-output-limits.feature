Feature: Cost and Output Limits

  Scenario: Provider output is capped before persistence
    Given a provider returns more sources or claims than the configured limit
    When the payload is normalized
    Then the normalized payload should not exceed the configured source limit
    And the normalized payload should not exceed the configured claim limit
    And oversized excerpts should be trimmed

  Scenario: Long answer content is bounded
    Given a provider returns answer content longer than the configured limit
    When the payload is normalized
    Then the answer content should be trimmed safely
    And the run should remain valid if required evidence is intact
