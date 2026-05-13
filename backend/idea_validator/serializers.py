from rest_framework import serializers
from .models import IdeaValidationSession, ValidationAnswer, IdeaValidatorQuota, Question, Option
from .constants import FINLO_PILLARS, QUESTION_PILLAR_MAPPING

class ValidationAnswerSerializer(serializers.ModelSerializer):
    pillar = serializers.SerializerMethodField()

    class Meta:
        model = ValidationAnswer
        fields = ('question_number', 'selected_option', 'other_text', 'free_text_response', 'pillar')

    def get_pillar(self, obj):
        pillar_code = QUESTION_PILLAR_MAPPING.get(obj.question_number)
        return FINLO_PILLARS.get(pillar_code)

class IdeaValidationSessionSerializer(serializers.ModelSerializer):
    answers = ValidationAnswerSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = IdeaValidationSession
        fields = (
            'id', 'user_email', 'status', 'current_step', 
            'form_step_completed', 'progress_text', 'verdict',
            'polished_report', 'red_team_report', 
            'created_at', 'updated_at', 'answers'
        )
        read_only_fields = ('polished_report', 'red_team_report', 'status', 'progress_text', 'verdict', 'form_step_completed')

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Hide red_team_report from non-superadmins
        request = self.context.get('request')
        if request and not request.user.has_role('super_admin'):
            ret.pop('red_team_report', None)
        return ret

class IdeaValidatorQuotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = IdeaValidatorQuota
        fields = ('remaining_validations', 'last_reset_quarter', 'updated_at')

class OptionSerializer(serializers.ModelSerializer):
    val = serializers.SerializerMethodField()
    ne = serializers.CharField(source='text_ne')
    en = serializers.CharField(source='text_en')

    class Meta:
        model = Option
        fields = ('val', 'ne', 'en')

    def get_val(self, obj):
        if obj.text_ne != obj.text_en:
            return f"{obj.text_ne} / {obj.text_en}"
        return obj.text_en

class QuestionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='order')
    step = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ('id', 'step', 'pillar', 'question_ne', 'question_en', 'hint_ne', 'hint_en', 'options')

    def get_step(self, obj):
        return (obj.order - 1) // 5 + 1

    def get_options(self, obj):
        options = OptionSerializer(obj.options_list.all(), many=True).data
        if obj.allow_other:
            options.append({
                "val": "Other",
                "ne": "अन्य",
                "en": "Other"
            })
        return options
