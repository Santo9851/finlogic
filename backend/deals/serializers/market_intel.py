"""
deals/serializers/market_intel.py
Serializers for Sector Research Reports.
"""
from rest_framework import serializers
from deals.models import SectorReport, SectorChoices, ComparableCompany, RegulatoryUpdate


class SectorReportSerializer(serializers.ModelSerializer):
    """Full CRUD serializer for SectorReport."""

    quarter_label = serializers.ReadOnlyField()
    generated_by_email = serializers.SerializerMethodField()
    sector_display = serializers.SerializerMethodField()

    class Meta:
        model = SectorReport
        fields = [
            'id', 'sector', 'sector_display', 'report_date', 'title',
            'content', 'summary', 'source_file', 'extracted_data',
            'status', 'generated_by', 'generated_by_email',
            'quarter_label', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'title', 'content', 'summary', 'extracted_data',
            'generated_by', 'created_at', 'updated_at',
        ]

    def get_generated_by_email(self, obj):
        if obj.generated_by:
            return obj.generated_by.email
        return None

    def get_sector_display(self, obj):
        return dict(SectorChoices.choices).get(obj.sector, obj.sector)


class SectorReportUpdateSerializer(serializers.ModelSerializer):
    """Serializer for GP editing a draft report (content, summary, status)."""

    class Meta:
        model = SectorReport
        fields = ['title', 'content', 'summary', 'status']

    def validate_status(self, value):
        if value not in ('DRAFT', 'PUBLISHED'):
            raise serializers.ValidationError("Status must be DRAFT or PUBLISHED.")
        return value


class SectorReportPublicSerializer(serializers.ModelSerializer):
    """Read-only serializer for the public Wisdom Hub – only PUBLISHED reports."""

    quarter_label = serializers.ReadOnlyField()
    sector_display = serializers.SerializerMethodField()

    class Meta:
        model = SectorReport
        fields = [
            'id', 'sector', 'sector_display', 'report_date', 'title',
            'content', 'summary', 'quarter_label',
            'created_at', 'updated_at',
        ]

    def get_sector_display(self, obj):
        return dict(SectorChoices.choices).get(obj.sector, obj.sector)


class SectorReportCreateSerializer(serializers.Serializer):
    """
    Accepts sector, quarter info, and optional file upload.
    Validates and returns parsed data for the view to create the report.
    """
    sector = serializers.ChoiceField(choices=SectorChoices.choices)
    quarter = serializers.IntegerField(min_value=1, max_value=4)
    year = serializers.IntegerField(min_value=2020, max_value=2100)
    source_file = serializers.FileField(required=False, allow_null=True)

    def validate(self, attrs):
        # Calculate report_date from quarter/year
        quarter = attrs['quarter']
        year = attrs['year']
        month = (quarter - 1) * 3 + 1
        from datetime import date
        attrs['report_date'] = date(year, month, 1)

        # Validate file extension if provided
        source_file = attrs.get('source_file')
        if source_file:
            ext = source_file.name.rsplit('.', 1)[-1].lower() if '.' in source_file.name else ''
            allowed = {'csv', 'pdf', 'png', 'jpg', 'jpeg'}
            if ext not in allowed:
                raise serializers.ValidationError({
                    'source_file': f"File type '.{ext}' not supported. Allowed: {', '.join(allowed)}"
                })

        return attrs


# ---------------------------------------------------------------------------
# Comparable Company (NEPSE Peer Benchmarking)
# ---------------------------------------------------------------------------


class ComparableCompanySerializer(serializers.ModelSerializer):
    """Full serializer for ComparableCompany list/detail."""

    sector_display = serializers.SerializerMethodField()

    class Meta:
        from deals.models import ComparableCompany
        model = ComparableCompany
        fields = [
            'id', 'name', 'ticker', 'sector', 'sector_display', 'exchange',
            'market_cap', 'ev_ebitda', 'pe_ratio', 'pb_ratio', 'ev_revenue',
            'last_updated', 'is_verified', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_sector_display(self, obj):
        return dict(SectorChoices.choices).get(obj.sector, obj.sector)


class ComparableCompanyUpsertRowSerializer(serializers.Serializer):
    """
    Validates a single row in the confirmed preview before upsert.
    At least one of ticker or name is required.
    """
    name = serializers.CharField(max_length=255)
    ticker = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    sector = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    exchange = serializers.CharField(max_length=20, required=False, default='NEPSE')
    market_cap = serializers.DecimalField(max_digits=20, decimal_places=2, required=False, allow_null=True, default=None)
    ev_ebitda = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, default=None)
    pe_ratio = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, default=None)
    pb_ratio = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, default=None)
    ev_revenue = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, default=None)

    def validate(self, attrs):
        if not attrs.get('name') and not attrs.get('ticker'):
            raise serializers.ValidationError("At least one of 'name' or 'ticker' is required.")
        return attrs


class ComparableCompanyConfirmSerializer(serializers.Serializer):
    """
    Accepts the reviewed/corrected preview rows for upsert.
    """
    source_filename = serializers.CharField(required=False, allow_blank=True, default='')
    rows = ComparableCompanyUpsertRowSerializer(many=True)

    def validate_rows(self, value):
        if not value:
            raise serializers.ValidationError("At least one row is required.")
        if len(value) > 500:
            raise serializers.ValidationError("Maximum 500 rows per upload.")
        return value
class RegulatoryUpdateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = RegulatoryUpdate
        fields = [
            'id', 'title', 'source_name', 'source_url', 'published_date',
            'original_file', 'raw_text', 'summary', 'status', 
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

class RegulatoryUpdateCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegulatoryUpdate
        fields = [
            'title', 'source_name', 'source_url', 'published_date',
            'original_file', 'raw_text', 'summary', 'status'
        ]
