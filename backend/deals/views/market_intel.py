"""
deals/views/market_intel.py
API views for Sector Research Reports.

Endpoints:
  POST   /api/market-intel/sector-reports/       – create (with optional file upload)
  GET    /api/market-intel/sector-reports/        – list all reports (GP, filterable)
  GET    /api/market-intel/sector-reports/{id}/   – detail
  PATCH  /api/market-intel/sector-reports/{id}/   – edit (update content, publish)
  GET    /api/insights/sector-reports/            – public (PUBLISHED only)
"""
import logging

from rest_framework import generics, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models as db_models

from deals.models import SectorReport, ImmutableAuditEvent, SectorChoices
from deals.serializers import (
    SectorReportSerializer,
    SectorReportCreateSerializer,
    SectorReportUpdateSerializer,
    SectorReportPublicSerializer,
)
from deals.permissions import IsGPStaff
from deals.signals import _log_audit_event

logger = logging.getLogger(__name__)


def _get_client_ip(request):
    x_fwd = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_fwd.split(',')[0].strip() if x_fwd else request.META.get('REMOTE_ADDR')


# ---------------------------------------------------------------------------
# GP (Authenticated) Endpoints
# ---------------------------------------------------------------------------


class SectorReportListCreateView(APIView):
    """
    GET  – List all sector reports (filterable by sector, status, date).
    POST – Create a new sector report with optional file upload.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get(self, request):
        qs = SectorReport.objects.all()

        # Filters
        sector = request.query_params.get('sector')
        if sector:
            qs = qs.filter(sector=sector)

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        year = request.query_params.get('year')
        if year:
            qs = qs.filter(report_date__year=int(year))

        serializer = SectorReportSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SectorReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        source_file = data.get('source_file')
        report_date = data['report_date']

        # Check for duplicate
        existing = SectorReport.objects.filter(
            sector=data['sector'],
            report_date=report_date,
        ).first()
        if existing:
            return Response(
                {'detail': f"A report for {data['sector']} {data['quarter']}Q {data['year']} already exists.",
                 'existing_id': str(existing.id)},
                status=status.HTTP_409_CONFLICT
            )

        # Create the report
        report = SectorReport.objects.create(
            sector=data['sector'],
            report_date=report_date,
            source_file=source_file,
            generated_by=request.user,
            status=SectorReport.Status.DRAFT,
        )

        # Kick off async extraction + generation
        from deals.tasks import extract_sector_report_data, generate_sector_report
        from celery import chain

        if source_file:
            # Chain: extract data first, then generate report
            chain(
                extract_sector_report_data.si(str(report.id)),
                generate_sector_report.si(str(report.id)),
            ).apply_async()
        else:
            # No file – generate directly from AI knowledge
            generate_sector_report.delay(str(report.id))

        result_serializer = SectorReportSerializer(report)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


class SectorReportDetailView(APIView):
    """
    GET   – Retrieve a single sector report.
    PATCH – Edit title, content, summary, or status. Logs edits to audit.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk):
        try:
            report = SectorReport.objects.get(pk=pk)
        except SectorReport.DoesNotExist:
            return Response({'detail': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SectorReportSerializer(report)
        return Response(serializer.data)

    def patch(self, request, pk):
        try:
            report = SectorReport.objects.get(pk=pk)
        except SectorReport.DoesNotExist:
            return Response({'detail': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SectorReportUpdateSerializer(report, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Capture old values for audit before saving
        old_content = report.content
        old_summary = report.summary
        old_status = report.status

        serializer.save()
        report.refresh_from_db()

        # Audit: log content/summary edits
        changes = {}
        if 'content' in request.data and request.data['content'] != old_content:
            changes['content'] = {
                'old': old_content[:500],
                'new': report.content[:500],
            }
        if 'summary' in request.data and request.data['summary'] != old_summary:
            changes['summary'] = {
                'old': old_summary[:500],
                'new': report.summary[:500],
            }

        if changes:
            _log_audit_event(
                ImmutableAuditEvent.EventType.SECTOR_REPORT_EDITED,
                report,
                actor=request.user,
                payload={
                    'report_id': str(report.id),
                    'report_title': report.title,
                    'changes': changes,
                },
                request=request,
            )

        # Audit: log publish action
        if old_status != report.status and report.status == 'PUBLISHED':
            _log_audit_event(
                ImmutableAuditEvent.EventType.SECTOR_REPORT_PUBLISHED,
                report,
                actor=request.user,
                payload={
                    'report_id': str(report.id),
                    'report_title': report.title,
                },
                request=request,
            )

        return Response(SectorReportSerializer(report).data)


# ---------------------------------------------------------------------------
# Public Endpoint (Wisdom Hub)
# ---------------------------------------------------------------------------


class PublicSectorReportListView(generics.ListAPIView):
    """
    GET /api/insights/sector-reports/
    Returns only PUBLISHED sector reports for the public Wisdom Hub.
    No authentication required.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = SectorReportPublicSerializer
    pagination_class = None

    def get_queryset(self):
        qs = SectorReport.objects.filter(status=SectorReport.Status.PUBLISHED)

        sector = self.request.query_params.get('sector')
        if sector:
            qs = qs.filter(sector=sector)

        year = self.request.query_params.get('year')
        if year:
            qs = qs.filter(report_date__year=int(year))

        return qs


class PublicSectorReportDetailView(generics.RetrieveAPIView):
    """
    GET /api/insights/sector-reports/{id}/
    Returns a single PUBLISHED sector report for the public.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = SectorReportPublicSerializer

    def get_queryset(self):
        return SectorReport.objects.filter(status=SectorReport.Status.PUBLISHED)


class SectorChoicesView(APIView):
    """
    GET /api/market-intel/sectors/
    Returns the list of available sectors for the frontend dropdown.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        choices = [
            {'value': value, 'label': label}
            for value, label in SectorChoices.choices
        ]
        return Response(choices)


# ---------------------------------------------------------------------------
# Comparable Company (NEPSE Peer Benchmarking)
# ---------------------------------------------------------------------------

# Known column aliases → canonical field names
COLUMN_ALIASES = {
    'company': 'name', 'company_name': 'name', 'company name': 'name',
    'symbol': 'ticker', 'stock_symbol': 'ticker', 'stock symbol': 'ticker', 'scrip': 'ticker',
    'mkt_cap': 'market_cap', 'market cap': 'market_cap', 'marketcap': 'market_cap', 'mcap': 'market_cap',
    'ev/ebitda': 'ev_ebitda', 'ev_ebitda': 'ev_ebitda', 'evebitda': 'ev_ebitda',
    'p/e': 'pe_ratio', 'pe': 'pe_ratio', 'p_e': 'pe_ratio', 'price_earnings': 'pe_ratio', 'price/earnings': 'pe_ratio',
    'p/b': 'pb_ratio', 'pb': 'pb_ratio', 'p_b': 'pb_ratio', 'price_book': 'pb_ratio', 'price/book': 'pb_ratio',
    'ev/revenue': 'ev_revenue', 'ev_rev': 'ev_revenue', 'evrevenue': 'ev_revenue', 'ev/sales': 'ev_revenue',
}

METRIC_FIELDS = {'market_cap', 'ev_ebitda', 'pe_ratio', 'pb_ratio', 'ev_revenue'}
ALL_FIELDS = {'name', 'ticker', 'sector', 'exchange'} | METRIC_FIELDS


def _auto_map_columns(raw_headers):
    """Map raw CSV headers to canonical field names."""
    mapping = {}
    for h in raw_headers:
        key = h.strip().lower().replace('-', '_')
        if key in ALL_FIELDS:
            mapping[h] = key
        elif key in COLUMN_ALIASES:
            mapping[h] = COLUMN_ALIASES[key]
    return mapping


def _parse_number(val):
    """Best-effort numeric parse, returns None on failure."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return val
    s = str(val).strip().replace(',', '').replace('%', '')
    if not s or s in ('-', 'N/A', 'n/a', 'NA', ''):
        return None
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


class CompsUploadView(APIView):
    """
    POST /api/market-intel/comps/upload/
    Accepts CSV/PDF/image, extracts data, returns a preview with column mapping.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        f = request.FILES.get('file')
        if not f:
            return Response({'detail': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        ext = f.name.rsplit('.', 1)[-1].lower() if '.' in f.name else ''
        allowed = {'csv', 'pdf', 'png', 'jpg', 'jpeg'}
        if ext not in allowed:
            return Response({'detail': f"Unsupported file type .{ext}"}, status=status.HTTP_400_BAD_REQUEST)

        # Save temp file
        import tempfile, os
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f'.{ext}')
        for chunk in f.chunks():
            tmp.write(chunk)
        tmp.close()

        try:
            from deals.tasks.market_intel import extract_file_data
            extracted = extract_file_data(tmp.name, f.name)
        finally:
            os.unlink(tmp.name)

        # Build preview rows from extracted data
        rows = []
        raw_headers = []
        data_type = extracted.get('type', 'unknown')

        if data_type == 'csv' and extracted.get('rows'):
            csv_rows = extracted['rows']
            if csv_rows:
                raw_headers = list(csv_rows[0].keys())
                for r in csv_rows:
                    rows.append(r)

        elif data_type in ('pdf_tables',) and extracted.get('tables'):
            for t in extracted['tables']:
                hdrs = t.get('headers', [])
                if hdrs:
                    raw_headers = hdrs
                for row_cells in t.get('rows', []):
                    row_dict = {}
                    for i, cell in enumerate(row_cells):
                        key = hdrs[i] if i < len(hdrs) else f'col_{i}'
                        row_dict[key] = cell
                    rows.append(row_dict)

        elif data_type in ('pdf_text', 'scanned_pdf_ocr', 'ocr') and extracted.get('text'):
            # Return raw text for AI-assisted extraction later
            return Response({
                'preview_type': 'text',
                'source_filename': f.name,
                'text': extracted['text'][:5000],
                'ocr_quality': extracted.get('ocr_quality', 'unknown'),
                'rows': [],
                'column_mapping': {},
                'detail': 'Text extracted. Manual entry or AI parsing required.',
            })

        # Auto-map columns
        column_mapping = _auto_map_columns(raw_headers)

        # Apply mapping to build preview rows
        preview_rows = []
        for raw_row in rows[:100]:  # Cap preview at 100 rows
            mapped = {}
            for raw_col, value in raw_row.items():
                field = column_mapping.get(raw_col)
                if field:
                    if field in METRIC_FIELDS:
                        mapped[field] = _parse_number(value)
                    else:
                        mapped[field] = str(value).strip() if value else ''
            # Only include rows with at least a name or ticker
            if mapped.get('name') or mapped.get('ticker'):
                if 'exchange' not in mapped:
                    mapped['exchange'] = 'NEPSE'
                preview_rows.append(mapped)

        return Response({
            'preview_type': 'table',
            'source_filename': f.name,
            'raw_headers': raw_headers,
            'column_mapping': column_mapping,
            'unmapped_headers': [h for h in raw_headers if h not in column_mapping],
            'rows': preview_rows,
            'total_raw_rows': len(rows),
            'total_preview_rows': len(preview_rows),
        })


class CompsConfirmView(APIView):
    """
    POST /api/market-intel/comps/confirm/
    Accepts the reviewed/corrected preview rows and upserts into ComparableCompany.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request):
        from deals.serializers import ComparableCompanyConfirmSerializer
        from deals.models import ComparableCompany

        serializer = ComparableCompanyConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rows = serializer.validated_data['rows']
        created_count = 0
        updated_count = 0
        errors = []

        for i, row in enumerate(rows):
            try:
                lookup = {}
                if row.get('ticker'):
                    lookup = {'ticker': row['ticker']}
                else:
                    lookup = {'name': row['name'], 'sector': row.get('sector', '')}

                defaults = {
                    'name': row['name'],
                    'exchange': row.get('exchange', 'NEPSE'),
                    'is_verified': True,
                }
                if row.get('ticker'):
                    defaults['ticker'] = row['ticker']
                if row.get('sector'):
                    defaults['sector'] = row['sector']
                for field in METRIC_FIELDS:
                    val = row.get(field)
                    if val is not None:
                        defaults[field] = val

                obj, created = ComparableCompany.objects.update_or_create(
                    defaults=defaults, **lookup
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1
            except Exception as e:
                errors.append({'row': i, 'error': str(e)})

        # Log audit event
        source_filename = serializer.validated_data.get('source_filename', 'manual_upload')
        try:
            ip = None
            if request:
                x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
                ip = (
                    x_forwarded.split(',')[0].strip()
                    if x_forwarded
                    else request.META.get('REMOTE_ADDR')
                )
            ImmutableAuditEvent.objects.create(
                event_type=ImmutableAuditEvent.EventType.COMPS_UPSERTED,
                actor=request.user,
                object_id=None,
                object_repr=f"Batch upsert of {len(rows)} comparables",
                content_type_label='deals.ComparableCompany',
                payload={
                    'source_filename': source_filename,
                    'total_rows_submitted': len(rows),
                    'created_count': created_count,
                    'updated_count': updated_count,
                    'error_count': len(errors),
                },
                ip_address=ip,
            )
        except Exception as exc:
            logger.error("Failed to write ImmutableAuditEvent for COMPS_UPSERTED: %s", exc)

        return Response({
            'created': created_count,
            'updated': updated_count,
            'errors': errors,
            'total': len(rows),
        })


class CompsListView(APIView):
    """
    GET /api/market-intel/comps/
    List all comparable companies with optional sector filter.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request):
        from deals.models import ComparableCompany
        from deals.serializers import ComparableCompanySerializer

        qs = ComparableCompany.objects.all()
        sector = request.query_params.get('sector')
        if sector:
            qs = qs.filter(sector=sector)
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(
                db_models.Q(name__icontains=search) | db_models.Q(ticker__icontains=search)
            )

        serializer = ComparableCompanySerializer(qs, many=True)
        return Response(serializer.data)


class CompsDetailView(APIView):
    """
    GET/PATCH/DELETE /api/market-intel/comps/{id}/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk):
        from deals.models import ComparableCompany
        from deals.serializers import ComparableCompanySerializer
        try:
            obj = ComparableCompany.objects.get(pk=pk)
        except ComparableCompany.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ComparableCompanySerializer(obj).data)

    def patch(self, request, pk):
        from deals.models import ComparableCompany
        from deals.serializers import ComparableCompanySerializer
        try:
            obj = ComparableCompany.objects.get(pk=pk)
        except ComparableCompany.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        ser = ComparableCompanySerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    def delete(self, request, pk):
        from deals.models import ComparableCompany
        try:
            obj = ComparableCompany.objects.get(pk=pk)
        except ComparableCompany.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Regulatory Updates
# ---------------------------------------------------------------------------

class RegulatoryUpdateListCreateView(APIView):
    """
    GET /api/market-intel/regulatory-updates/
    POST /api/market-intel/regulatory-updates/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get(self, request):
        from deals.models import RegulatoryUpdate
        from deals.serializers import RegulatoryUpdateSerializer

        qs = RegulatoryUpdate.objects.all()
        source = request.query_params.get('source')
        if source:
            qs = qs.filter(source_name=source)
        status_param = request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        serializer = RegulatoryUpdateSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        from deals.models import RegulatoryUpdate
        from deals.serializers import RegulatoryUpdateCreateUpdateSerializer, RegulatoryUpdateSerializer
        from deals.tasks.market_intel import generate_regulatory_summary

        ser = RegulatoryUpdateCreateUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        # Handle file upload if present
        original_file = request.FILES.get('original_file')
        raw_text = ser.validated_data.get('raw_text', '')

        if original_file and not raw_text:
            # Re-use extract_file_data task's inner logic or do simple extraction here
            # Since extract_file_data is a celery task, we can use _extract_pdf_text or _extract_docx directly
            # For simplicity, we just use the `extract_file_data` logic locally.
            from deals.tasks.market_intel import _extract_pdf_text
            try:
                # Save it temporarily
                temp_obj = RegulatoryUpdate(
                    title=ser.validated_data.get('title', 'temp'),
                    source_name=ser.validated_data.get('source_name'),
                    published_date=ser.validated_data.get('published_date'),
                    original_file=original_file
                )
                temp_obj.save()
                
                ext = original_file.name.lower().split('.')[-1]
                if ext == 'pdf':
                    extracted = _extract_pdf_text(temp_obj.original_file.path)
                    if extracted.get('type') == 'pdf_tables':
                        raw_text = extracted.get('full_text', '')
                    else:
                        raw_text = extracted.get('text', '')
                elif ext in ('png', 'jpg', 'jpeg'):
                    # Ocr
                    import pytesseract
                    from PIL import Image
                    try:
                        img = Image.open(temp_obj.original_file.path)
                        raw_text = pytesseract.image_to_string(img)
                    except Exception as e:
                        logger.error(f"OCR failed for regulatory update: {e}")
                elif ext == 'docx':
                    import docx
                    try:
                        doc = docx.Document(temp_obj.original_file.path)
                        raw_text = '\n'.join([p.text for p in doc.paragraphs])
                    except Exception as e:
                        logger.error(f"DOCX extraction failed: {e}")
                
                temp_obj.raw_text = raw_text
                temp_obj.created_by = request.user
                
                # Apply other fields from serializer
                for k, v in ser.validated_data.items():
                    if k not in ['original_file', 'raw_text']:
                        setattr(temp_obj, k, v)
                temp_obj.save()
                obj = temp_obj

            except Exception as e:
                return Response({'detail': f'File extraction failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            obj = RegulatoryUpdate.objects.create(
                **ser.validated_data,
                created_by=request.user
            )

        # Trigger summary generation if raw_text is present and summary is empty
        if obj.raw_text and not obj.summary:
            generate_regulatory_summary.delay(str(obj.id))

        return Response(RegulatoryUpdateSerializer(obj).data, status=status.HTTP_201_CREATED)


class RegulatoryUpdateDetailView(APIView):
    """
    GET /api/market-intel/regulatory-updates/{id}/
    PATCH /api/market-intel/regulatory-updates/{id}/
    DELETE /api/market-intel/regulatory-updates/{id}/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get_object(self, pk):
        from deals.models import RegulatoryUpdate
        from django.shortcuts import get_object_or_404
        return get_object_or_404(RegulatoryUpdate, pk=pk)

    def get(self, request, pk):
        from deals.serializers import RegulatoryUpdateSerializer
        obj = self.get_object(pk)
        return Response(RegulatoryUpdateSerializer(obj).data)

    def patch(self, request, pk):
        from deals.serializers import RegulatoryUpdateCreateUpdateSerializer, RegulatoryUpdateSerializer
        obj = self.get_object(pk)
        
        # Track before state for audit
        old_status = obj.status
        old_text = obj.raw_text
        old_summary = obj.summary

        ser = RegulatoryUpdateCreateUpdateSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()

        # Audit logic here could go into signals or here
        from deals.models import ImmutableAuditEvent
        from deals.signals import _log_audit_event
        _log_audit_event(
            # Reusing SECTOR_REPORT_EDITED or we could add REGULATORY_UPDATE_EDITED
            ImmutableAuditEvent.EventType.SECTOR_REPORT_EDITED,
            obj,
            actor=request.user,
            payload={
                'old_status': old_status,
                'new_status': obj.status,
                'text_changed': old_text != obj.raw_text,
                'summary_changed': old_summary != obj.summary,
            },
            request=request
        )

        return Response(RegulatoryUpdateSerializer(obj).data)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegulatoryUpdateGenerateSummaryView(APIView):
    """
    POST /api/market-intel/regulatory-updates/{id}/generate-summary/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        from deals.models import RegulatoryUpdate
        from deals.tasks.market_intel import generate_regulatory_summary
        try:
            obj = RegulatoryUpdate.objects.get(pk=pk)
        except RegulatoryUpdate.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        generate_regulatory_summary.delay(str(obj.id))
        return Response({'detail': 'Summary generation triggered.'})


class PublicRegulatoryUpdateListView(APIView):
    """
    GET /api/insights/regulatory-updates/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from deals.models import RegulatoryUpdate
        from deals.serializers import RegulatoryUpdateSerializer

        qs = RegulatoryUpdate.objects.filter(status=RegulatoryUpdate.StatusChoices.PUBLISHED)
        serializer = RegulatoryUpdateSerializer(qs, many=True)
        return Response(serializer.data)

