Feature: Visual design system (cyber)
  As a stakeholder reviewing TraceMap
  I want core screens to use consistent cyber tokens and primitives
  So that the product feels cohesive without ad hoc colors

  Background:
    Given the TraceMap application is running

  Scenario: Home page exposes TraceMap hierarchy and question intake
    When I open the home page
    Then I should see the product title "TraceMap"
    And the page should use the shared layout and panel styling

  Scenario: Tokens are documented and wired
    Then design tokens in globals.css should define background, foreground, accent, and border for dark cyber baseline
    And panel surfaces should use elevated background and border tokens
