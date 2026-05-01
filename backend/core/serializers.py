from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    UserProfile,
    Project,
    ProjectScore,
    ProjectFile,
    ProjectComment,
    ProjectEvaluation,
    Investor,
    Fund,
    InvestorCommitment,
    PortfolioCompany,
    Deal,
    Course,
    CourseModule,
    Lesson,
    Enrollment,
    Article,
    Series,
    ArticleCompletion,
    DownloadableTool,
    ReaderProfile,
    Webinar,
    WebinarRegistration,
    Contact,
    ContactInteraction,
    AuditLog,
)

User = get_user_model()


# ---------------------------------------------------------------------------
# Auth & User
# ---------------------------------------------------------------------------

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_approved:
            from rest_framework import serializers
            raise serializers.ValidationError({
                'detail': 'Your account is pending admin approval. You will be able to login once an administrator reviews your request.'
            })
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['roles'] = user.roles # Comma-separated string as per user model
        token['is_approved'] = user.is_approved
        return token


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[User.Role.ENTREPRENEUR, User.Role.INVESTOR], write_only=True) # Only allow specific roles

    email = serializers.EmailField(write_only=True) # Override to remove model validation for uniqueness check here

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password_confirm',
                  'first_name', 'last_name', 'phone', 'role')
        read_only_fields = ('id', 'username')
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

    def validate_email(self, value):
        # We handle existing emails in the view/create method instead of a hard validation error
        # so that we can create a RoleRequest.
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        email = validated_data['email']
        role = validated_data.pop('role')
        
        try:
            user = User.objects.get(email=email)
            # Check if this role is already possessed or requested
            if role in user.role_list:
                raise serializers.ValidationError({"email": f"User is already registered as {role}."})
            
            from .models import RoleRequest
            if RoleRequest.objects.filter(user=user, requested_role=role, status='pending').exists():
                raise serializers.ValidationError({"email": f"A request for {role} access is already pending."})
            
            # Create a role request instead of a new user
            RoleRequest.objects.create(user=user, requested_role=role)
            # We'll handle the response in the view (status 202)
            return user
            
        except User.DoesNotExist:
            # Auto-generate username from email if not provided
            if not validated_data.get('username'):
                base = validated_data['email'].split('@')[0]
                # Ensure uniqueness
                username = base
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f'{base}{counter}'
                    counter += 1
                validated_data['username'] = username
            
            validated_data['roles'] = role
            validated_data['is_approved'] = False # Explicitly set to False for new registrations
            user = User.objects.create_user(**validated_data)
            # Create corresponding profile
            UserProfile.objects.create(user=user, profile_type=role)
            return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('id', 'profile_type', 'data', 'created_at', 'updated_at')


class UserSerializer(serializers.ModelSerializer):
    profiles = UserProfileSerializer(many=True, read_only=True)
    roles = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone',
                  'roles', 'role', 'is_approved', 'email_verified_at', 'profiles', 'created_at', 'updated_at')
        read_only_fields = ('id', 'username', 'roles', 'role', 'is_approved', 'email', 'created_at', 'updated_at')

    def get_roles(self, obj):
        return obj.role_list

    def get_role(self, obj):
        roles = obj.role_list
        return roles[0] if roles else 'entrepreneur'


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({'uid': 'Invalid user.'})

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({'token': 'Invalid or expired token.'})

        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['id', 'first_name', 'last_name', 'email', 'company', 'source', 'status', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at', 'status']
    
    def create(self, validated_data):
        # Set default status for new web inquiries
        validated_data['status'] = Contact.Status.LEAD
        return super().create(validated_data)


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

class ProjectScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectScore
        fields = '__all__'


class ProjectFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFile
        fields = '__all__'


class ProjectCommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = ProjectComment
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    scores = ProjectScoreSerializer(many=True, read_only=True)
    files = ProjectFileSerializer(many=True, read_only=True)
    comments = ProjectCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'user', 'title', 'slug', 'status', 'submission_data',
                  'total_score', 'final_decision_notes', 'submitted_at',
                  'reviewed_at', 'scores', 'files', 'comments',
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'slug', 'total_score', 'created_at', 'updated_at')


class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ('id', 'title', 'status', 'submission_data', 'created_at')
        read_only_fields = ('id', 'created_at')


class ProjectEvaluationDetailSerializer(serializers.ModelSerializer):
    """Read serializer for a persisted ProjectEvaluation (Phase 2 response)."""

    class Meta:
        model = ProjectEvaluation
        fields = (
            'id',
            'project',
            'evaluated_by',
            'score_data',
            'total_score',
            'verdict',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Investor
# ---------------------------------------------------------------------------

class InvestorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investor
        fields = '__all__'


class PortfolioCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioCompany
        fields = ('id', 'project', 'name', 'sector', 'country',
                  'investment_date', 'investment_amount', 'valuation',
                  'current_valuation', 'exit_date', 'exit_type', 'exit_value',
                  'created_at')


class FundSerializer(serializers.ModelSerializer):
    portfolio_companies = PortfolioCompanySerializer(many=True, read_only=True)

    class Meta:
        model = Fund
        fields = ('id', 'name', 'vintage_year', 'target_size', 'committed_capital',
                  'status', 'portfolio_companies', 'created_at')


class InvestorCommitmentSerializer(serializers.ModelSerializer):
    investor = serializers.StringRelatedField(read_only=True)
    fund = FundSerializer(read_only=True)

    class Meta:
        model = InvestorCommitment
        fields = ('id', 'investor', 'fund', 'commitment_amount', 'called_amount',
                  'distributed_amount', 'commitment_date', 'created_at')


# ---------------------------------------------------------------------------
# Educational Platform
# ---------------------------------------------------------------------------

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = '__all__'


class CourseModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = CourseModule
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    modules = CourseModuleSerializer(many=True, read_only=True)
    module_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ('id', 'title', 'slug', 'description', 'pillar', 'level',
                  'duration_hours', 'featured_image', 'is_published',
                  'module_count', 'modules', 'created_at', 'updated_at')

    def get_module_count(self, obj):
        return obj.modules.count()


class SeriesSerializer(serializers.ModelSerializer):
    article_count = serializers.IntegerField(read_only=True, source='articles.count')

    class Meta:
        model = Series
        fields = ('id', 'title', 'slug', 'description', 'pillar', 'order',
                  'total_articles', 'is_published', 'article_count', 'created_at')


class DownloadableToolSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()
    has_access = serializers.SerializerMethodField()

    class Meta:
        model = DownloadableTool
        fields = ('id', 'title', 'description', 'file', 'file_type', 'requires_subscription', 'has_access')

    def get_has_access(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        
        # Staff/Admin/Superadmin always have access
        if user and (user.is_staff or user.has_role('admin') or user.has_role('super_admin')):
            return True
            
        # Article context
        article = obj.article
        
        # Access based on article number and subscription
        if not user or user.is_anonymous:
            return False
            
        if not obj.requires_subscription or article.is_free:
            return True
            
        # If part of the first 2 articles, allow download for authenticated users
        if (article.article_number or 0) <= 2:
            return True
            
        return False

    def get_file(self, obj):
        if self.get_has_access(obj):
            request = self.context.get('request')
            if obj.file:
                url = obj.file.url
                if request:
                    return request.build_absolute_uri(url)
                return url
        return None


class ArticleSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    read_time    = serializers.SerializerMethodField()
    author_name  = serializers.SerializerMethodField()
    featured_image = serializers.SerializerMethodField()  # resolves upload > URL
    
    # Metered / Series fields
    series_info = serializers.SerializerMethodField()
    access_level = serializers.SerializerMethodField()
    snippet = serializers.SerializerMethodField()
    teaser_bullets = serializers.SerializerMethodField()
    full_content = serializers.CharField(source='content', read_only=True)
    tools = DownloadableToolSerializer(many=True, read_only=True)
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ('id', 'author', 'author_name', 'title', 'slug', 'excerpt', 
                  'full_content', 'snippet', 'teaser_text', 'teaser_bullets',
                  'featured_image', 'pillar', 'is_published', 'published_at',
                  'read_time', 'series', 'series_info', 'article_number', 
                  'is_free', 'access_level', 'tools', 'is_completed',
                  'created_at', 'updated_at')

    def get_featured_image(self, obj):
        """Return uploaded file URL if available, else the stored URL string."""
        url = obj.cover_image_url
        if not url:
            return None
        if url.startswith('http'):
            return url
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_read_time(self, obj):
        if not obj.content:
            return '1 min read'
        word_count = len(obj.content.split())
        minutes = max(1, round(word_count / 200))
        return f'{minutes} min read'

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.username
        return 'Finlogic Research'

    def get_series_info(self, obj):
        if obj.series:
            return {
                "title": obj.series.title,
                "slug": obj.series.slug,
                "total_articles": obj.series.total_articles
            }
        return None

    def get_access_level(self, obj):
        request = self.context.get('request')
        user = request.user if request else None

        # Rule: If not in a series, it's always full
        if not obj.series:
            return 'full'
        
        # Rule: If article is marked as free, it's always full
        if obj.is_free:
            return 'full'

        # Rule: Staff/Admin/Superadmin always have full access
        if user and (user.is_staff or user.has_role('admin') or user.has_role('super_admin')):
            return 'full'

        # Rule: Anonymous users only get article 1
        if not user or user.is_anonymous:
            return 'full' if obj.article_number == 1 else 'cliffhanger'

        # Rule: Authenticated users get articles 1 and 2
        return 'full' if (obj.article_number or 0) <= 2 else 'cliffhanger'

    def get_snippet(self, obj):
        if self.get_access_level(obj) == 'cliffhanger':
            return obj.content[:500] + "..." if obj.content else ""
        return None

    def get_teaser_bullets(self, obj):
        if obj.teaser_text:
            return [line.strip() for line in obj.teaser_text.split('\n') if line.strip()]
        
        if obj.content:
            sentences = obj.content.split('.')[:3]
            return [s.strip() + "." for s in sentences if s.strip()]
        return []

    def get_is_completed(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if user and user.is_authenticated:
            return ArticleCompletion.objects.filter(user=user, article=obj).exists()
        return False

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # If cliffhanger, hide the full content
        if data.get('access_level') == 'cliffhanger':
            data['full_content'] = None
        return data


class ReaderProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = ReaderProfile
        fields = ('id', 'user_email', 'completed_articles', 'joined_at')


class ArticleCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleCompletion
        fields = '__all__'




class WebinarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Webinar
        fields = ('id', 'title', 'description', 'speaker', 'scheduled_at',
                  'duration_minutes', 'registration_url', 'recording_url',
                  'pillar', 'is_published', 'created_at')


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ('id', 'user', 'course', 'status', 'progress_percent',
                  'completed_at', 'enrolled_at', 'last_accessed_at')
        read_only_fields = ('id', 'user', 'enrolled_at', 'last_accessed_at')


class WebinarRegistrationSerializer(serializers.ModelSerializer):
    webinar = WebinarSerializer(read_only=True)

    class Meta:
        model = WebinarRegistration
        fields = '__all__'
