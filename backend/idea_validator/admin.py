from django.contrib import admin
from .models import (
    IdeaValidationSession, 
    ValidationAnswer, 
    IdeaValidatorQuota, 
    QuotaAdjustmentLog,
    ValidatorPrompt,
    Question,
    Option
)

class OptionInline(admin.TabularInline):
    model = Option
    extra = 3

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('order', 'pillar', 'title_en', 'is_active')
    list_filter = ('pillar', 'is_active')
    search_fields = ('title_en', 'question_en', 'title_ne', 'question_ne')
    inlines = [OptionInline]
    ordering = ('order',)

@admin.register(IdeaValidationSession)
class IdeaValidationSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'verdict', 'created_at')
    list_filter = ('status', 'verdict')
    search_fields = ('user__email', 'verdict')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(ValidationAnswer)
class ValidationAnswerAdmin(admin.ModelAdmin):
    list_display = ('session', 'question_number', 'selected_option')
    list_filter = ('question_number',)

@admin.register(IdeaValidatorQuota)
class IdeaValidatorQuotaAdmin(admin.ModelAdmin):
    list_display = ('user', 'remaining_validations', 'last_reset_quarter', 'updated_at')
    search_fields = ('user__email',)
    readonly_fields = ('updated_at',)

    def save_model(self, request, obj, form, change):
        if change and 'remaining_validations' in form.changed_data:
            # Manually detect the change to log it
            old_obj = IdeaValidatorQuota.objects.get(pk=obj.pk)
            old_value = old_obj.remaining_validations
            new_value = obj.remaining_validations
            
            # Log the change
            QuotaAdjustmentLog.objects.create(
                user=obj.user,
                adjusted_by=request.user,
                old_value=old_value,
                new_value=new_value,
                change_amount=new_value - old_value,
                note="Manual adjustment via Django Admin"
            )
        super().save_model(request, obj, form, change)

@admin.register(QuotaAdjustmentLog)
class QuotaAdjustmentLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'adjusted_by', 'change_amount', 'old_value', 'new_value', 'created_at')
    list_filter = ('created_at', 'adjusted_by')
    search_fields = ('user__email', 'note')
    readonly_fields = ('created_at',)

@admin.register(ValidatorPrompt)
class ValidatorPromptAdmin(admin.ModelAdmin):
    list_display = ('task_type', 'is_active', 'updated_at')