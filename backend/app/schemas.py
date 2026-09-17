"""Pydantic v2 request and response contracts (camelCase JSON)."""

from datetime import date, datetime
from typing import Generic, Literal, TypeVar

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class InputModel(ApiModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")


class ErrorBody(ApiModel):
    code: str
    message: str
    details: list | dict | None = None


class ErrorResponse(ApiModel):
    error: ErrorBody


T = TypeVar("T")


class Page(ApiModel, Generic[T]):
    items: list[T]
    page: int
    page_size: int
    total: int
    total_pages: int


class Health(ApiModel):
    status: str
    database: str


class ContractSummary(ApiModel):
    id: str
    name: str
    contract_type: str = Field(validation_alias=AliasChoices("contract_type", "type"), serialization_alias="type")
    current_version: str
    last_modified: date
    owner: str
    department: str
    compliance: str
    review_status: str
    effective_date: date
    expiry_date: date
    risk: str
    counterparty: str
    jurisdiction: str
    description: str
    archived_at: datetime | None
    updated_at: datetime


class ContractCreate(InputModel):
    id: str | None = Field(default=None, pattern=r"^CTR-[A-Z0-9-]{3,12}$")
    name: str = Field(min_length=2, max_length=200)
    contract_type: str = Field(
        min_length=2,
        max_length=80,
        validation_alias=AliasChoices("contract_type", "type"),
        serialization_alias="type",
    )
    owner: str = Field(min_length=2, max_length=100)
    department: str = Field(min_length=2, max_length=80)
    compliance: Literal["Compliant", "Needs Review", "Exception"]
    review_status: Literal["Approved", "Reviewing", "Action Required", "Pending"] = "Pending"
    effective_date: date
    expiry_date: date
    risk: Literal["Low", "Medium", "High"] = "Medium"
    counterparty: str = Field(default="", max_length=200)
    jurisdiction: str = Field(default="", max_length=120)
    description: str = Field(default="", max_length=5000)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.expiry_date < self.effective_date:
            raise ValueError("expiryDate must not be before effectiveDate")
        return self


class ContractUpdate(InputModel):
    updated_at: datetime
    name: str | None = Field(default=None, min_length=2, max_length=200)
    contract_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=80,
        validation_alias=AliasChoices("contract_type", "type"),
        serialization_alias="type",
    )
    owner: str | None = Field(default=None, min_length=2, max_length=100)
    department: str | None = Field(default=None, min_length=2, max_length=80)
    compliance: Literal["Compliant", "Needs Review", "Exception"] | None = None
    review_status: Literal["Approved", "Reviewing", "Action Required", "Pending"] | None = None
    effective_date: date | None = None
    expiry_date: date | None = None
    risk: Literal["Low", "Medium", "High"] | None = None
    counterparty: str | None = Field(default=None, max_length=200)
    jurisdiction: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=5000)


class ContractBulkAction(InputModel):
    contract_ids: list[str] = Field(min_length=1, max_length=100)
    action: Literal["archive", "restore", "set_compliance"]
    value: Literal["Compliant", "Needs Review", "Exception"] | None = None

    @model_validator(mode="after")
    def validate_action_value(self):
        if self.action == "set_compliance" and self.value is None:
            raise ValueError("value is required for set_compliance")
        if self.action != "set_compliance" and self.value is not None:
            raise ValueError("value is only valid for set_compliance")
        return self


class BulkActionResult(ApiModel):
    affected: int
    action: str


class VersionOut(ApiModel):
    id: str
    contract_id: str
    label: str
    version_date: date = Field(validation_alias=AliasChoices("version_date", "date"), serialization_alias="date")
    author: str
    note: str
    sequence: int


class ClauseCreate(InputModel):
    title: str = Field(min_length=2, max_length=160)
    text: str = Field(min_length=1, max_length=100000)
    status: Literal["Compliant", "Needs Review", "Exception"] = "Needs Review"
    tier: Literal["Preferred", "Acceptable", "Fallback", "Restricted"] = "Acceptable"
    guidance: str = Field(default="", max_length=5000)
    source_section: str = Field(default="", max_length=160)


class VersionCreate(InputModel):
    label: str = Field(min_length=1, max_length=20)
    effective_date: date
    author: str = Field(min_length=2, max_length=100)
    note: str = Field(default="", max_length=300)
    clauses: list[ClauseCreate] = Field(min_length=1, max_length=500)


class ClauseUpdate(InputModel):
    updated_at: datetime
    title: str | None = Field(default=None, min_length=2, max_length=160)
    text: str | None = Field(default=None, min_length=1, max_length=100000)
    status: Literal["Compliant", "Needs Review", "Exception"] | None = None
    tier: Literal["Preferred", "Acceptable", "Fallback", "Restricted"] | None = None
    guidance: str | None = Field(default=None, max_length=5000)
    source_section: str | None = Field(default=None, max_length=160)


class ObligationMappingUpdate(InputModel):
    obligation_ids: list[str] = Field(max_length=200)


class ObligationMappingOut(ApiModel):
    clause_id: str
    obligation_ids: list[str]


class ObligationCreate(InputModel):
    name: str = Field(min_length=2, max_length=160)
    category: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=1, max_length=5000)


class ObligationUpdate(InputModel):
    updated_at: datetime
    name: str | None = Field(default=None, min_length=2, max_length=160)
    category: str | None = Field(default=None, min_length=2, max_length=80)
    description: str | None = Field(default=None, min_length=1, max_length=5000)


class ObligationOut(ApiModel):
    id: str
    name: str
    category: str
    description: str
    archived_at: datetime | None
    updated_at: datetime


class ClauseOut(ApiModel):
    id: str
    clause_key: str
    contract_id: str
    version_id: str
    title: str
    text: str
    version: str
    status: str
    tags: list[str]
    page_number: int
    tier: str
    guidance: str
    source_section: str
    matched_text: str | None = None
    match: str | None = None
    archived_at: datetime | None = None
    updated_at: datetime | None = None


class ContractDetail(ContractSummary):
    versions: list[VersionOut]
    clauses: list[ClauseOut]


class ClauseSearchRequest(InputModel):
    query: str = Field(min_length=1)
    mode: Literal["AND", "OR"] = "AND"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    contract_id: str | None = None
    status: str | None = None
    tier: str | None = None


class VersionComparisonRequest(InputModel):
    contract_id: str
    base_version_id: str
    target_version_id: str = Field(validation_alias=AliasChoices("targetVersionId", "comparedVersionId"))


class SimilarityGraphRequest(InputModel):
    threshold: float = Field(default=0.35, ge=0, le=1)


class CoverageRequest(InputModel):
    contract_id: str


class DashboardPortfolio(ApiModel):
    total_contracts: int
    compliance_exceptions: int
    needs_review: int
    open_reviews: int


class DashboardSummary(ApiModel):
    portfolio: DashboardPortfolio
    recent_contracts: list[ContractSummary]
    review_queue: list[dict]


class ComparisonOut(ApiModel):
    contract_id: str
    base_version: VersionOut
    target_version: VersionOut
    changes: list[dict]


class SimilarityGraphOut(ApiModel):
    threshold: float
    nodes: list[dict]
    edges: list[dict]
    components: list[list[str]]


class CoverageOut(ApiModel):
    contract_id: str
    obligations: list[dict]
    selected_clauses: list[str]
    covered: int
    total: int
    status: Literal["Complete Coverage", "Partial Coverage"]
    uncovered_obligation_ids: list[str]


class ReviewerOut(ApiModel):
    id: str
    name: str
    role: str
    assigned: int
    capacity: int
    expertise: list[str]


class ProposalRequest(InputModel):
    contract_ids: list[str] | None = None


class AssignmentItem(InputModel):
    contract_id: str
    reviewer_id: str
    cost: int = Field(ge=0)
    confidence: Literal["Strong fit", "Good fit"]


class ProposalOut(ApiModel):
    assignments: list[AssignmentItem]
    assigned_count: int
    total_cost: int
    unassigned_contract_ids: list[str]
    objective: str


class ConfirmAssignments(InputModel):
    assignments: list[AssignmentItem] = Field(min_length=1)


class ConfirmedAssignments(ApiModel):
    assignments: list[dict]


class ReviewOut(ApiModel):
    id: str
    contract_id: str
    contract: str
    reviewer_id: str | None
    reviewer: str
    priority: str
    issue: str
    due: date
    status: str
    updated_at: datetime


class ReviewStatusUpdate(InputModel):
    status: Literal["Pending", "In Review", "Needs Clarification", "Completed"]


class DecisionCreate(InputModel):
    decision: Literal["Approved", "Rejected", "Needs Clarification"]
    notes: str = Field(min_length=1, max_length=2000)
    decided_by: str = Field(min_length=1, max_length=100)


class DecisionOut(ApiModel):
    id: str
    review_id: str
    decision: str
    notes: str
    decided_by: str
    decided_at: datetime


class AuditEventOut(ApiModel):
    id: str
    timestamp: datetime
    user: str
    action: str
    entity: str
    entity_type: str
    detail: str
    status: str


class SettingsUpdate(InputModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=100)
    role: str | None = Field(default=None, min_length=1, max_length=100)
    email: str | None = Field(default=None, min_length=3, max_length=200)
    default_queue_sort: str | None = None
    version_comparison: Literal["Side-by-side", "Unified diff"] | None = None
    show_clause_compliance_tags: bool | None = None
    confirm_status_changes: bool | None = None
    new_assignments: bool | None = None
    due_date_reminders: bool | None = None
    compliance_exceptions: bool | None = None
    weekly_summary: bool | None = None


class SettingsOut(ApiModel):
    display_name: str
    role: str
    email: str
    default_queue_sort: str
    version_comparison: str
    show_clause_compliance_tags: bool
    confirm_status_changes: bool
    new_assignments: bool
    due_date_reminders: bool
    compliance_exceptions: bool
    weekly_summary: bool
