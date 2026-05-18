"""
Deals package submodule imports.
"""
from .fund import (
    batch_send_capital_call_emails,
    generate_lp_statements,
    generate_management_fee_accruals
)

from .deal import (
    generate_ai_spa_draft,
    generate_ai_term_sheet,
    generate_memo_draft,
    move_project_documents_to_b2
)

from .analysis import (
    extract_financials_from_document,
    extract_text_from_excel,
    extract_text_from_pdf,
    generate_ai_valuation,
    run_commercial_analysis,
    run_finlo_scoring,
    run_full_analysis,
    run_nepal_compliance_check,
    run_operational_analysis,
    run_qoe_analysis,
    scan_legal_document
)

from .market_intel import (
    extract_sector_report_data,
    generate_sector_report
)

__all__ = [
    'batch_send_capital_call_emails',
    'extract_financials_from_document',
    'extract_sector_report_data',
    'extract_text_from_excel',
    'extract_text_from_pdf',
    'generate_ai_spa_draft',
    'generate_ai_term_sheet',
    'generate_ai_valuation',
    'generate_lp_statements',
    'generate_management_fee_accruals',
    'generate_memo_draft',
    'generate_sector_report',
    'move_project_documents_to_b2',
    'run_commercial_analysis',
    'run_finlo_scoring',
    'run_full_analysis',
    'run_nepal_compliance_check',
    'run_operational_analysis',
    'run_qoe_analysis',
    'scan_legal_document'
]
