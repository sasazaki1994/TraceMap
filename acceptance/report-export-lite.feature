Feature: Report Export Lite

  Scenario: User views a generated briefing report markdown
    Given an analysis run has completed
    When the run page displays the briefing report
    Then the report should include an executive summary
    And the report should include key claims
    And the report should include supporting sources
    And the report should include unknowns or open questions
    And the report should include source lineage summary
    And the report should include source quality notes

  Scenario: User copies briefing report markdown
    Given an analysis run has completed
    When the user clicks Copy Markdown
    Then the generated report markdown should be copied to the clipboard
    And the UI should show a copied confirmation

  Scenario: Clipboard failure does not break the report panel
    Given an analysis run has completed
    When the clipboard API is unavailable
    And the user clicks Copy Markdown
    Then the report panel should not crash
    And the UI should show a copy failure message

  Scenario: User downloads briefing report markdown
    Given an analysis run has completed
    When the user clicks Download Markdown
    Then a .md file should be generated
    And the file name should include the run id or timestamp
