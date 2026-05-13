"""
Rate Limiter para MedFlow Pro API
Previene ataques de fuerza bruta en login/register
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
