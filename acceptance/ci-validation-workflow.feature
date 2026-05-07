Feature: CI validation workflow reproduces local quality gates
  As a maintainer
  I want GitHub Actions to reproduce local validation commands
  So that pull requests are blocked when baseline quality checks regress

  Scenario: Static checks run on pull_request and push to main
    Given CI is triggered by pull_request or push to main
    When install-and-static-checks starts
    Then corepack is enabled
    And frozen lockfile install succeeds
    And prisma generate and prisma validate succeed
    And lint, typecheck, unit test, and build succeed

  Scenario: Migration checks run against PostgreSQL service
    Given PostgreSQL service is healthy in CI
    When database-checks runs
    Then prisma migrate deploy succeeds on tracemap
    And prisma migrate status reports no pending migration issue
    And migration deploy succeeds on a fresh verification database when configured

  Scenario: E2E runs with Playwright Chromium on CI runner
    Given PostgreSQL service is healthy in CI
    And Playwright Chromium is installed by CI
    When e2e job runs
    Then pnpm test:e2e succeeds without requiring OpenAI API key
