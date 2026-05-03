Feature: Real Investigation Pipeline

  Scenario: OpenAI provider rejects insufficient grounding
    Given the OpenAI provider returns sufficient_grounding false
    When an analysis run is created
    Then the run should be marked as failed
    And no completed answer snapshot should be presented as grounded

  Scenario: OpenAI provider rejects invalid source references
    Given the OpenAI provider returns a claim referencing an unknown source id
    When the structured payload is validated
    Then validation should fail
    And the failure reason should mention the unknown source id

  Scenario: OpenAI provider produces normalized evidence
    Given the OpenAI provider returns valid sources and claims
    When the payload is transformed
    Then each claim should be linked to existing source placeholders
    And the graph should contain source, claim, and answer nodes
    And no UI-only style fields should be required from the model
