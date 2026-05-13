import os
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from idea_validator.models import Question, Option
from idea_validator.constants import FINLO_QUESTIONS

def seed_questions():
    print("Seeding Idea Validator Questions from constants.py...")
    
    for q_data in FINLO_QUESTIONS:
        question, created = Question.objects.get_or_create(
            order=q_data['id'],
            defaults={
                'pillar': q_data['pillar'],
                'title_en': q_data['title_en'],
                'title_ne': q_data['title_np'],
                'question_en': q_data['question_en'],
                'question_ne': q_data['question_np'],
                'hint_en': q_data['hint'],
                'hint_ne': q_data['hint'],
                'allow_other': q_data.get('allow_other', True)
            }
        )
        
        if created:
            print(f"Created Q{question.order}: {question.title_en}")
            for idx, opt_str in enumerate(q_data['options']):
                parts = opt_str.split(' / ')
                ne = parts[0] if len(parts) > 0 else opt_str
                en = parts[1] if len(parts) > 1 else opt_str
                
                Option.objects.create(
                    question=question,
                    text_ne=ne,
                    text_en=en,
                    order=idx
                )
        else:
            print(f"Q{question.order} already exists, skipping.")

if __name__ == "__main__":
    seed_questions()
    print("Seeding complete.")
