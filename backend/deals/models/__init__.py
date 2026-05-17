"""
Deals package submodule imports.
"""
from .fund import (
    CapitalCall,
    Distribution,
    Fund,
    GPDividend,
    GPShareholder,
    ImmutableAuditEvent,
    LPFundCommitment,
    LPKYCDocument,
    LPProfile,
    LPSupportRequest,
    ManagementFeeAccrual,
    PEInvestment
)

from .deal import (
    DealMemo,
    EntrepreneurKYBDocument,
    FundDocument,
    LPDocumentAccess,
    PEFormTemplate,
    PEProject,
    PEProjectDocument,
    PEProjectFormResponse,
    SPADraft,
    TermSheet,
    validate_ocr_number
)

from .analysis import (
    AICallLog,
    CommercialAnalysis,
    ComplianceGate,
    CriterionScore,
    DCFAssumptions,
    ExitScenario,
    ExtractedFinancials,
    LBOAssumptions,
    OperationalAnalysis,
    PromptLibrary,
    QoEReport,
    RedFlagFinding,
    RedFlagPattern,
    ScoringRun,
    ValuationModel,
    ValuationRecord,
    WaterfallModel,
    WaterfallRun
)

from .compliance import (
    ConflictOfInterest,
    FilingTypeConfig,
    PortfolioKPIReport,
    RegulatoryChecklist,
    SEBONFilingDeadline
)

from .governance import (
    GPInvestorMeeting,
    GPInvestorMeetingRequest,
    GovernanceProposal,
    IRDocument,
    ProposalVote
)

__all__ = [
    'AICallLog',
    'CapitalCall',
    'CommercialAnalysis',
    'ComplianceGate',
    'ConflictOfInterest',
    'CriterionScore',
    'DCFAssumptions',
    'DealMemo',
    'Distribution',
    'EntrepreneurKYBDocument',
    'ExitScenario',
    'ExtractedFinancials',
    'FilingTypeConfig',
    'Fund',
    'FundDocument',
    'GPDividend',
    'GPInvestorMeeting',
    'GPInvestorMeetingRequest',
    'GPShareholder',
    'GovernanceProposal',
    'IRDocument',
    'ImmutableAuditEvent',
    'LBOAssumptions',
    'LPDocumentAccess',
    'LPFundCommitment',
    'LPKYCDocument',
    'LPProfile',
    'LPSupportRequest',
    'ManagementFeeAccrual',
    'OperationalAnalysis',
    'PEFormTemplate',
    'PEInvestment',
    'PEProject',
    'PEProjectDocument',
    'PEProjectFormResponse',
    'PortfolioKPIReport',
    'PromptLibrary',
    'ProposalVote',
    'QoEReport',
    'RedFlagFinding',
    'RedFlagPattern',
    'RegulatoryChecklist',
    'SEBONFilingDeadline',
    'SPADraft',
    'ScoringRun',
    'TermSheet',
    'ValuationModel',
    'ValuationRecord',
    'WaterfallModel',
    'WaterfallRun',
    'validate_ocr_number'
]
