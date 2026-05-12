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

  Scenario: OpenAI structured schema accepts claim-source support relations
    Given the OpenAI answer graph provider is selected
    When the provider builds the structured output schema
    Then claim objects should allow support_relations
    And each support relation should reference a source id
    And each support relation should allow support_kind
    And each support relation should allow is_primary_source
    And each support relation should allow supporting_quote
    And each support relation should allow contradiction_note

  Scenario: Support relations are preserved into persisted evidence payload
    Given a structured OpenAI payload contains support_relations
    When the payload is converted into a generated answer graph payload
    Then claim support entries should include support kind
    And primary source flags should be preserved
    And supporting quotes should be preserved
    And contradiction notes should be preserved
