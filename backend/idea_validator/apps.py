from django.apps import AppConfig

class IdeaValidatorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'idea_validator'
    verbose_name = 'Idea Validator'

    def ready(self):
        import idea_validator.signals
