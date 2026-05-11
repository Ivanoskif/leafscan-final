from django.shortcuts import render
from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    JwtUserSerializer,
    JwtRegisterSerializer,
    JwtLoginSerializer,
    JwtChangePasswordSerializer,
    JwtResetPasswordSerializer,
)


# Create your views here.

User = get_user_model()

class JwtRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = JwtRegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "User registered successfully.",
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": JwtUserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JwtLoginView(TokenObtainPairView):
    serializer_class = JwtLoginSerializer
    permission_classes = [AllowAny]


class JwtLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {
                    "refresh": "Refresh token is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {
                    "message": "Logout successful."
                },
                status=status.HTTP_200_OK,
            )

        except Exception:
            return Response(
                {
                    "refresh": "Invalid or already blacklisted refresh token."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class JwtMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            JwtUserSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )


class JwtChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = JwtChangePasswordSerializer(data=request.data)

        if serializer.is_valid():
            user = request.user

            old_password = serializer.validated_data["old_password"]
            new_password = serializer.validated_data["new_password"]

            if not user.check_password(old_password):
                return Response(
                    {
                        "old_password": "Old password is incorrect."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.set_password(new_password)
            user.save()

            return Response(
                {
                    "message": "Password changed successfully. Please login again."
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JwtResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = JwtResetPasswordSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data["email"]
            new_password = serializer.validated_data["new_password"]

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response(
                    {
                        "email": "User with this email does not exist."
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            user.set_password(new_password)
            user.save()

            return Response(
                {
                    "message": "Password reset successfully."
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)