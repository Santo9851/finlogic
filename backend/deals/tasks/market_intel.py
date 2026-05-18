"""
deals/tasks/market_intel.py
Celery tasks for Sector Research Report generation.

Pipeline:
  1. extract_sector_report_data(report_id) – parse uploaded file
  2. generate_sector_report(report_id)    – call AI to produce markdown report
"""
import csv
import io
import json
import logging
import os
from decimal import Decimal, InvalidOperation

from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# File extraction helpers
# ---------------------------------------------------------------------------

def _extract_csv(file_path: str) -> dict:
    """Parse a CSV file into a list of dicts with numeric conversion."""
    rows = []
    try:
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                clean_row = {}
                for k, v in row.items():
                    if v is None:
                        clean_row[k] = None
                        continue
                    v = v.strip()
                    # Attempt numeric conversion
                    try:
                        clean_row[k] = float(Decimal(v.replace(',', '')))
                    except (InvalidOperation, ValueError):
                        clean_row[k] = v
                rows.append(clean_row)
        return {'type': 'csv', 'rows': rows, 'row_count': len(rows)}
    except Exception as e:
        logger.error(f"CSV extraction failed: {e}")
        return {'type': 'csv', 'error': str(e), 'rows': []}


def _extract_pdf_text(file_path: str) -> dict:
    """
    Extract text from a text-based PDF using PyMuPDF (fitz).
    Attempts basic table detection by looking for aligned content.
    """
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        pages_text = []
        tables = []

        for page_num, page in enumerate(doc):
            text = page.get_text()
            pages_text.append(text)

            # Simple table detection: look for tab-separated or pipe-separated content
            lines = text.split('\n')
            table_lines = []
            for line in lines:
                stripped = line.strip()
                if not stripped:
                    continue
                # Heuristic: lines with 3+ tab/pipe separators are likely table rows
                if stripped.count('\t') >= 2 or stripped.count('|') >= 2:
                    if '\t' in stripped:
                        cells = [c.strip() for c in stripped.split('\t')]
                    else:
                        cells = [c.strip() for c in stripped.split('|') if c.strip()]
                    table_lines.append(cells)

            if len(table_lines) >= 2:
                tables.append({
                    'page': page_num + 1,
                    'headers': table_lines[0],
                    'rows': table_lines[1:],
                })

        doc.close()

        full_text = '\n\n--- Page Break ---\n\n'.join(pages_text)

        if tables:
            return {
                'type': 'pdf_tables',
                'tables': tables,
                'full_text': full_text[:10000],  # Cap for JSON storage
                'page_count': len(pages_text),
            }
        else:
            return {
                'type': 'pdf_text',
                'text': full_text[:10000],
                'page_count': len(pages_text),
            }

    except Exception as e:
        logger.error(f"PDF text extraction failed: {e}")
        return {'type': 'pdf_text', 'error': str(e), 'text': ''}


def _extract_image_ocr(file_path: str) -> dict:
    """
    OCR extraction from image files.
    Uses pytesseract if available, otherwise falls back to a simple placeholder.
    """
    try:
        import pytesseract
        from PIL import Image

        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)

        if not text or len(text.strip()) < 20:
            return {
                'type': 'ocr',
                'text': text,
                'ocr_quality': 'low',
                'note': 'Very little text detected. Image may be unclear.',
            }

        # Simple table detection for OCR: look for aligned numbers
        lines = [l for l in text.split('\n') if l.strip()]
        numeric_lines = []
        for line in lines:
            # Count number-like tokens
            tokens = line.split()
            num_count = sum(1 for t in tokens if any(c.isdigit() for c in t))
            if num_count >= 2 and len(tokens) >= 3:
                numeric_lines.append(tokens)

        result = {
            'type': 'ocr',
            'text': text[:10000],
            'ocr_quality': 'medium' if len(text.strip()) > 100 else 'low',
        }
        if numeric_lines:
            result['detected_table_rows'] = numeric_lines[:50]

        return result

    except ImportError:
        logger.warning("pytesseract not installed – OCR skipped, using placeholder.")
        return {
            'type': 'ocr',
            'text': '',
            'ocr_quality': 'unavailable',
            'note': 'OCR libraries not available in this environment.',
        }
    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        return {'type': 'ocr', 'error': str(e), 'text': '', 'ocr_quality': 'low'}


def _extract_scanned_pdf(file_path: str) -> dict:
    """
    Handle scanned PDFs by converting to images first (pdf2image) then OCR.
    Falls back to PyMuPDF text extraction if pdf2image is unavailable.
    """
    try:
        from pdf2image import convert_from_path
        import pytesseract

        images = convert_from_path(file_path, first_page=1, last_page=5)
        all_text = []
        for i, img in enumerate(images):
            text = pytesseract.image_to_string(img)
            all_text.append(text)

        combined = '\n\n--- Page Break ---\n\n'.join(all_text)
        return {
            'type': 'scanned_pdf_ocr',
            'text': combined[:10000],
            'page_count': len(images),
            'ocr_quality': 'medium' if len(combined.strip()) > 100 else 'low',
        }
    except ImportError:
        logger.warning("pdf2image not installed – falling back to PyMuPDF text extraction.")
        return _extract_pdf_text(file_path)
    except Exception as e:
        logger.error(f"Scanned PDF extraction failed: {e}")
        return _extract_pdf_text(file_path)


def extract_file_data(file_path: str, filename: str) -> dict:
    """
    Main dispatcher: routes to the correct extraction function based on file extension.
    """
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''

    if ext == 'csv':
        return _extract_csv(file_path)
    elif ext == 'pdf':
        # Try text extraction first; if result is mostly empty, attempt OCR
        result = _extract_pdf_text(file_path)
        text = result.get('text', result.get('full_text', ''))
        if len(text.strip()) < 50 and not result.get('tables'):
            logger.info("PDF has little text – attempting scanned PDF OCR...")
            return _extract_scanned_pdf(file_path)
        return result
    elif ext in ('png', 'jpg', 'jpeg'):
        return _extract_image_ocr(file_path)
    else:
        return {'type': 'unknown', 'error': f'Unsupported file type: .{ext}'}


# ---------------------------------------------------------------------------
# Celery tasks
# ---------------------------------------------------------------------------

@shared_task(bind=True, name='deals.tasks.extract_sector_report_data')
def extract_sector_report_data(self, report_id: str):
    """
    Extract structured data from the uploaded source_file and save to extracted_data.
    """
    from deals.models import SectorReport

    try:
        report = SectorReport.objects.get(pk=report_id)
    except SectorReport.DoesNotExist:
        logger.error(f"SectorReport {report_id} not found.")
        return

    if not report.source_file:
        logger.info(f"SectorReport {report_id} has no source file – skipping extraction.")
        return

    file_path = report.source_file.path
    filename = os.path.basename(report.source_file.name)

    logger.info(f"Extracting data from {filename} for SectorReport {report_id}...")
    extracted = extract_file_data(file_path, filename)

    report.extracted_data = extracted
    report.save(update_fields=['extracted_data', 'updated_at'])
    logger.info(f"Data extraction complete for SectorReport {report_id}: type={extracted.get('type')}")


@shared_task(bind=True, name='deals.tasks.generate_sector_report')
def generate_sector_report(self, report_id: str):
    """
    AI-driven sector report generation.

    1. Reads extracted_data (if any) to build context.
    2. Prompts Gemini Flash / DeepSeek R1 for a professional research report.
    3. Saves the result in content + summary.
    4. Keeps status = DRAFT for GP review.
    """
    from deals.models import SectorReport, SectorChoices
    from deals.ai_client import AIModelClient, AIBudgetGuard

    try:
        report = SectorReport.objects.get(pk=report_id)
    except SectorReport.DoesNotExist:
        logger.error(f"SectorReport {report_id} not found.")
        return

    sector_label = dict(SectorChoices.choices).get(report.sector, report.sector)
    quarter_label = report.quarter_label  # e.g. "Q1 2026"

    # Build context from extracted data
    data_context = ""
    if report.extracted_data:
        ed = report.extracted_data
        data_type = ed.get('type', 'none')

        if data_type == 'csv' and ed.get('rows'):
            # Summarize CSV data
            rows = ed['rows']
            sample = json.dumps(rows[:10], indent=2, default=str)
            data_context = f"""
## Supplied Data (CSV – {ed.get('row_count', len(rows))} rows)
Sample rows:
```json
{sample}
```
"""
        elif data_type in ('pdf_tables',) and ed.get('tables'):
            tables_summary = []
            for t in ed['tables'][:3]:
                headers = ' | '.join(t.get('headers', []))
                rows_sample = '\n'.join([' | '.join(r) for r in t.get('rows', [])[:5]])
                tables_summary.append(f"**Page {t.get('page')}:**\n{headers}\n{rows_sample}")
            data_context = f"""
## Supplied Data (PDF Tables)
{chr(10).join(tables_summary)}
"""
        elif data_type in ('pdf_text', 'scanned_pdf_ocr', 'ocr') and ed.get('text'):
            text = ed['text'][:3000]
            quality = ed.get('ocr_quality', 'unknown')
            data_context = f"""
## Supplied Data (Extracted Text, quality: {quality})
{text}
"""

    # Build the AI prompt
    system_prompt = """You are a senior investment research analyst at Finlogic Capital, Nepal's premier private equity firm.
You produce institutional-grade sector research reports for the Nepalese market.
Your writing is professional, data-driven, and suitable for institutional investors.
Use clean Markdown formatting with proper headers, bullet points, and tables where appropriate.
All monetary figures should be in NPR (Nepalese Rupees) unless specified otherwise.
Always include both quantitative analysis and qualitative assessment."""

    user_prompt = f"""Generate a professional investment research report for the **{sector_label}** sector in Nepal as of **{quarter_label}**.

{data_context if data_context else "No supplementary data was provided. Use your knowledge of the Nepalese market."}

## Required Sections

### 1. Market Overview
- Current market size and growth trajectory in NPR
- Key economic indicators affecting this sector
- Recent quarter highlights and macro trends

### 2. Competitive Landscape
- Major players in Nepal's {sector_label} sector
- Market share distribution and recent shifts
- Emerging challengers and disruption trends

### 3. Regulatory Environment
- Key regulatory bodies (NRB, SEBON, sector-specific)
- Recent policy changes and upcoming regulations
- Compliance considerations for PE investors

### 4. Investment Trends
- Deal flow and transaction volumes
- Valuation multiples and benchmarks
- Notable transactions in the recent quarter

### 5. Finlogic's Investment Thesis
- Opportunity assessment for the {sector_label} sector
- Target sub-segments with highest alpha potential
- Risk-adjusted return expectations
- Recommended entry strategy

## Executive Summary
End with a concise 3-line executive summary capturing the key investment message.

Output the complete report in clean Markdown. Use tables for comparative data. Be specific to Nepal."""

    try:
        # Check budget
        if not AIBudgetGuard.can_make_call():
            logger.error("AI budget exceeded – cannot generate sector report.")
            report.content = "⚠️ AI budget limit reached. Report generation deferred."
            report.summary = "Budget limit reached."
            report.save(update_fields=['content', 'summary', 'updated_at'])
            return

        client = AIModelClient()
        result = client._call_gemini(
            'gemini-2.5-flash',
            system_prompt,
            user_prompt,
        )
        text, p_tokens, c_tokens, latency, cost = result

        # Track cost
        AIBudgetGuard.track_cost(cost)

        # Log to AICallLog
        from deals.models import AICallLog
        AICallLog.objects.create(
            task_type='sector_report_generation',
            model_name='gemini-2.5-flash',
            prompt_tokens=p_tokens,
            completion_tokens=c_tokens,
            total_tokens=p_tokens + c_tokens,
            estimated_cost_usd=round(cost, 6),
            latency_ms=latency,
            status='SUCCESS',
        )

        # Extract executive summary (last section)
        content = text
        summary = ""
        if "## Executive Summary" in text:
            parts = text.split("## Executive Summary")
            content_body = parts[0].strip()
            summary = parts[1].strip()
            content = text  # Keep full text including summary
        elif "### Executive Summary" in text:
            parts = text.split("### Executive Summary")
            summary = parts[1].strip() if len(parts) > 1 else ""

        # Fallback: use first 3 lines as summary
        if not summary:
            lines = [l.strip() for l in text.split('\n') if l.strip() and not l.startswith('#')]
            summary = ' '.join(lines[:3])

        report.content = content
        report.summary = summary[:2000]
        report.save(update_fields=['content', 'summary', 'updated_at'])

        logger.info(
            f"Sector report generated for {report.title}: "
            f"{p_tokens + c_tokens} tokens, ${cost:.6f}, {latency}ms"
        )

    except Exception as e:
        logger.error(f"Sector report generation failed for {report_id}: {e}")
        report.content = f"⚠️ Report generation failed: {str(e)}"
        report.summary = "Generation error."
        report.save(update_fields=['content', 'summary', 'updated_at'])

        # Log failure
        try:
            from deals.models import AICallLog
            AICallLog.objects.create(
                task_type='sector_report_generation',
                model_name='gemini-2.5-flash',
                status='ERROR',
                error_message=str(e),
            )
        except:
            pass


@shared_task
def generate_regulatory_summary(update_id: str) -> None:
    """
    Generate a 3-bullet summary for a RegulatoryUpdate using Gemini Flash.
    """
    from deals.models import RegulatoryUpdate
    from deals.services.gemini_service import GeminiService
    from deals.models import AICallLog

    try:
        update_obj = RegulatoryUpdate.objects.get(id=update_id)
    except RegulatoryUpdate.DoesNotExist:
        logger.warning(f"RegulatoryUpdate {update_id} not found.")
        return

    if not update_obj.raw_text:
        logger.warning(f"RegulatoryUpdate {update_id} has no raw text to summarize.")
        return

    prompt = (
        "Summarize the following Nepali regulatory document in exactly 3 bullet points. "
        "Each bullet should start with a bold keyword followed by a concise explanation:\n"
        "(1) What changed?\n"
        "(2) Who is affected?\n"
        "(3) Action required.\n\n"
        f"Document Text:\n{update_obj.raw_text[:20000]}"
    )

    try:
        result = GeminiService.call_flash(
            prompt=prompt,
            max_tokens=500,
            temperature=0.2
        )
        text = result.get('text', '').strip()
        
        # Log successful AI call
        p_tokens = result.get('prompt_tokens', 0)
        c_tokens = result.get('completion_tokens', 0)
        cost = result.get('cost', 0.0)
        latency = result.get('latency_ms', 0)

        AICallLog.objects.create(
            task_type='regulatory_summary_generation',
            model_name='gemini-2.5-flash',
            prompt_tokens=p_tokens,
            completion_tokens=c_tokens,
            total_cost=cost,
            latency_ms=latency,
            status='SUCCESS',
        )

        update_obj.summary = text
        update_obj.save(update_fields=['summary', 'updated_at'])

        logger.info(
            f"Regulatory summary generated for {update_obj.title}: "
            f"{p_tokens + c_tokens} tokens, ${cost:.6f}, {latency}ms"
        )

    except Exception as e:
        logger.error(f"Regulatory summary generation failed for {update_id}: {e}")
        update_obj.summary = f"⚠️ Summary generation failed: {str(e)}"
        update_obj.save(update_fields=['summary', 'updated_at'])

        try:
            AICallLog.objects.create(
                task_type='regulatory_summary_generation',
                model_name='gemini-2.5-flash',
                status='ERROR',
                error_message=str(e),
            )
        except:
            pass
