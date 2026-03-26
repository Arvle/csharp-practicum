export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'C# Практикум';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const DEFAULT_GROUPS = (import.meta.env.VITE_DEFAULT_GROUPS || 'ИСП-211,ИСП-212,ИСП-213,ПРО-111,ПРО-112').split(',');
export const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'auth_token';
export const USER_KEY = import.meta.env.VITE_USER_KEY || 'user';