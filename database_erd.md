# Database ER Diagram (Autism Screening System Segregation)

Here is the Entity-Relationship Diagram detailing the tables we created and modified over the last few hours to segregate risk data and track state-wise progression.

```mermaid
erDiagram
    %% Core Tables (Pre-existing context)
    CHILDREN ||--|| CHILD_SUMMARIES : "1:1 tracks latest status"

    %% Child Summaries (Single source of truth)
    CHILD_SUMMARIES {
        text child_id PK
        text child_name
        text risk_assessment
        text actioned
        text latest_screening_id
        text updated_at
    }

    %% Segregated Risk Tables
    CHILD_SUMMARIES ||--o| HIGH_RISK_CHILDREN : "Categorizes into"
    CHILD_SUMMARIES ||--o| MEDIUM_RISK_CHILDREN : "Categorizes into"
    CHILD_SUMMARIES ||--o| LOW_RISK_CHILDREN : "Categorizes into"

    HIGH_RISK_CHILDREN {
        text child_id PK
        text child_name
        text actioned
        text clinical_review_notes
        text action_taken
        text result
        int year
    }

    MEDIUM_RISK_CHILDREN {
        text child_id PK
        text child_name
        text actioned
        text clinical_review_notes
        text action_taken
        text result
        int year
    }

    LOW_RISK_CHILDREN {
        text child_id PK
        text child_name
        text actioned
        text clinical_review_notes
        text action_taken
        text result
        int year
    }
    
    %% Triggers
    HIGH_RISK_CHILDREN |o--o| MEDIUM_RISK_CHILDREN : "Trigger: Shifted to MEDIUM Risk"

    %% State Progression Tracking Module
    STATE_CASES ||--o{ CASE_PROGRESS : "Tracks monthly progress"
    STATE_PERFORMANCE ||--o{ STATE_CASES : "Aggregates performance"

    STATE_CASES {
        text child_id PK
        text child_name
        text state FK "Implicit mapping to STATE_PERFORMANCE"
        text actioned
        text risk_assessment
        text month
        text results
    }

    CASE_PROGRESS {
        text progress_id PK
        text case_id FK "References STATE_CASES(child_id)"
        text month
        text risk_assessment
        text result
        int improvement_score
    }

    STATE_PERFORMANCE {
        text state PK
        int early_action_score
        int improvement_score
        int service_quality_score
        int total_score
    }
```

### Table Breakdown

1. **`child_summaries`**: The single source of truth summarizing the latest screening status for every child, preventing duplicate records.
2. **`high_risk_children`, `medium_risk_children`, `low_risk_children`**: Three completely isolated tables strictly for categorizing children by their risk level natively in PostgreSQL. Includes a Postgres Trigger that automatically copies a child from the High Risk table to the Medium Risk table if their result changes to "Shifted to MEDIUM risk".
3. **`state_cases`**: The base table for the advanced state-tracking module, capturing the "final" or "latest" monthly status of a child organized by their geographical state.
4. **`case_progress`**: A child table to `state_cases` linked by `case_id`. It stores the exact month-by-month historical timeline (February, March, April) for each individual child.
5. **`state_performance`**: An aggregated table acting as the overall leaderboard, containing the heavily calculated Early Action, Improvement, and Service Quality scores.
