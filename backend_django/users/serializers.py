from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    type = serializers.CharField(source='user_type', read_only=True)
    branches = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'business_name', 'type', 'branches', 'createdAt',
            'phone', 'business_location', 'business_description', 'logo_url', 'slug', 'status'
        ]
        read_only_fields = ['id', 'status', 'type', 'branches', 'createdAt']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_branches(self, obj):
        return obj.branches.count()

    def update(self, instance, validated_data):
        name = validated_data.pop('name', None)
        if name:
            name_parts = name.strip().split(' ', 1)
            instance.first_name = name_parts[0] if name_parts else ''
            instance.last_name = name_parts[1] if len(name_parts) > 1 else ''
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=True)
    business_name = serializers.CharField(required=True)
    business_location = serializers.CharField(required=True)
    plan = serializers.ChoiceField(choices=['Free', 'Basic', 'Popular', 'Premium'], required=True)
    business_description = serializers.CharField(required=False, allow_blank=True)
    payment_screenshot = serializers.ImageField(required=False)

    def validate(self, attrs):
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "User with this email already exists."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('plan')
        validated_data.pop('payment_screenshot', None)
        full_name = validated_data.pop('full_name')
        name_parts = full_name.strip().split(' ', 1)
        validated_data['first_name'] = name_parts[0] if name_parts else ''
        validated_data['last_name'] = name_parts[1] if len(name_parts) > 1 else ''
        validated_data['username'] = validated_data['email']
        user = User.objects.create_user(**validated_data)
        user.status = 'PENDING_APPROVAL'
        user.set_unusable_password()
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")
        if user.status != 'ACTIVE':
            raise serializers.ValidationError("Account is not active. Please contact support.")
        attrs['user'] = user
        return attrs

    def create_tokens(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
