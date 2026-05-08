Feature: Report Export Lite

Scenario: User copies the briefing report markdown
  Given an analysis run has completed
  When the briefing report panel is displayed
  And the user clicks the copy markdown button
  Then the briefing report markdown should be copied to the clipboard
  And the UI should show a copy success state

Scenario: User downloads the briefing report markdown
  Given an analysis run has completed
  When the briefing report panel is displayed
  And the user clicks the download markdown button
  Then a markdown file should be generated from the briefing report content
  And the file name should be safe for local download

Scenario: User copies the company research report markdown
  Given an analysis run has completed
  When the company research report panel is displayed
  And the user clicks the copy markdown button
  Then the company research report markdown should be copied to the clipboard
  And the UI should show a copy success state

Scenario: User downloads the company research report markdown
  Given an analysis run has completed
  When the company research report panel is displayed
  And the user clicks the download markdown button
  Then a markdown file should be generated from the company research report content
  And the file name should be safe for local download
