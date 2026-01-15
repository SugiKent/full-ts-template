# preset-category Specification

## Purpose
TBD - created by archiving change add-preset-category-api. Update Purpose after archive.
## Requirements
### Requirement: Preset Category List

The system SHALL provide an API endpoint to retrieve preset categories for onboarding.

#### Scenario: Get preset categories

- **WHEN** client calls `preset.getCategories`
- **THEN** return a list of preset categories with id, title, and icon

#### Scenario: No authentication required

- **WHEN** client calls `preset.getCategories` without authentication
- **THEN** the request SHALL succeed (public endpoint)

### Requirement: Preset Category Data Structure

Each preset category SHALL contain the following fields:
- `id`: Unique identifier (string, kebab-case)
- `title`: Display name (string, localized)
- `icon`: Emoji icon (string)

#### Scenario: Category data structure

- **WHEN** client receives preset categories
- **THEN** each category SHALL have `id`, `title`, and `icon` fields

### Requirement: Default Preset Categories

The system SHALL provide approximately 10 default preset categories based on PROJECT.md specification:
- 旅行 (travel)
- スキル習得 (skill)
- 趣味 (hobby)
- 健康 (health)
- キャリア (career)
- お金 (money)
- 人間関係 (relationship)
- 自己投資 (self-investment)
- 体験 (experience)
- その他 (other)

#### Scenario: Default categories available

- **WHEN** client calls `preset.getCategories`
- **THEN** return at least 10 preset categories

