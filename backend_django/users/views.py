from rest_framework import generics, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, ChangePasswordSerializer
from tenants.models import Plan
from core.models import Payment, AuditLog
from core.utils.mailer import send_registration_confirmation_email, send_admin_new_registration_email, send_tenant_approval_email
from tenants.models import Subscription
import uuid
import os
import random
import string
import traceback

User = get_user_model()


def _get_user_response(user):
    refresh = RefreshToken.for_user(user)
    return {
        'token': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def tenant_login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        if user.user_type != 'tenant':
            raise serializers.ValidationError("Invalid credentials.")
        user.temp_password = None
        user.save()
        return Response(_get_user_response(user), status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        if user.user_type != 'admin':
            raise serializers.ValidationError("Invalid credentials.")
        return Response(_get_user_response(user), status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    try:
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        try:
            send_registration_confirmation_email(
                tenant_email=user.email,
                tenant_name=f"{user.first_name} {user.last_name}".strip() or user.business_name,
                business_name=user.business_name,
                user=user,
            )
        except Exception as e:
            print(f"Registration email error: {e}")

        plan_name = request.data.get('plan', 'Free')
        plan = Plan.objects.filter(name=plan_name, is_active=True).first()
        amount = plan.price_monthly if plan else 0

        payment_screenshot = request.FILES.get('payment_screenshot')
        screenshot_url = None
        if payment_screenshot:
            try:
                import cloudinary.uploader
                result = cloudinary.uploader.upload(
                    payment_screenshot,
                    folder='kitchenos/payments',
                    resource_type='image'
                )
                screenshot_url = result.get('secure_url')
            except Exception as e:
                print(f"Cloudinary upload error: {e}")
                fallback_dir = os.path.join(settings.BASE_DIR, 'media', 'payments')
                os.makedirs(fallback_dir, exist_ok=True)
                unique_filename = f"{uuid.uuid4().hex}-{payment_screenshot.name}"
                file_path = os.path.join(fallback_dir, unique_filename)
                with open(file_path, 'wb+') as destination:
                    for chunk in payment_screenshot.chunks():
                        destination.write(chunk)
                screenshot_url = f"/media/payments/{unique_filename}"

        Payment.objects.create(
            user=user,
            amount=amount,
            method='bank_transfer',
            reference_number=request.data.get('reference_number', ''),
            notes=request.data.get('notes', ''),
            status='PENDING',
            screenshot=screenshot_url,
        )

        if plan:
            Subscription.objects.create(
                user=user,
                plan=plan,
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=30),
                status='PENDING',
                branches_used=0,
                items_used=0,
            )

        try:
            admin_email = os.environ.get('ADMIN_EMAIL', 'nahomm2010@gmail.com')
            send_admin_new_registration_email(
                admin_email=admin_email,
                tenant_name=f"{user.first_name} {user.last_name}".strip() or user.business_name,
                tenant_email=user.email,
                business_name=user.business_name,
                plan_name=plan.name if plan else 'Free',
                amount=amount,
                user=user,
            )
        except Exception as e:
            print(f"Admin notification email error: {e}")

        return Response({
            'message': 'Registration submitted! Awaiting admin approval.',
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email, user_type='tenant')
    except User.DoesNotExist:
        return Response({'error': 'No tenant account found with this email.'}, status=status.HTTP_404_NOT_FOUND)
    new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    user.set_password(new_password)
    user.temp_password = new_password
    user.save()
    try:
        send_tenant_approval_email(
            tenant_email=user.email,
            tenant_name=f"{user.first_name} {user.last_name}".strip() or user.business_name,
            password=new_password,
            business_name=user.business_name,
            user=user,
        )
    except Exception as e:
        print(f"Forgot password email error: {e}")
    return Response({'message': 'A new password has been sent to your email.'}, status=status.HTTP_200_OK)
