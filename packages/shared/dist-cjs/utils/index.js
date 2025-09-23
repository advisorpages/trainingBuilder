"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvVar = exports.isProduction = exports.isDevelopment = exports.buildQueryString = exports.buildApiUrl = exports.groupBy = exports.unique = exports.isValidPassword = exports.isValidEmail = exports.capitalize = exports.truncate = exports.slugify = exports.formatTime = exports.formatDateTime = exports.formatDate = void 0;
// Date utilities
const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};
exports.formatDate = formatDate;
const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};
exports.formatDateTime = formatDateTime;
const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};
exports.formatTime = formatTime;
// String utilities
const slugify = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.slugify = slugify;
const truncate = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 3) + '...';
};
exports.truncate = truncate;
const capitalize = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};
exports.capitalize = capitalize;
// Validation utilities
const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidPassword = (password) => {
    return password.length >= 8 && password.length <= 100;
};
exports.isValidPassword = isValidPassword;
// Array utilities
const unique = (array) => {
    return [...new Set(array)];
};
exports.unique = unique;
const groupBy = (array, key) => {
    return array.reduce((groups, item) => {
        const group = String(item[key]);
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {});
};
exports.groupBy = groupBy;
// API utilities
const buildApiUrl = (baseUrl, endpoint) => {
    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    return `${cleanBase}/${cleanEndpoint}`;
};
exports.buildApiUrl = buildApiUrl;
const buildQueryString = (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    });
    return searchParams.toString();
};
exports.buildQueryString = buildQueryString;
// Environment utilities
const isDevelopment = () => {
    return process.env.NODE_ENV === 'development';
};
exports.isDevelopment = isDevelopment;
const isProduction = () => {
    return process.env.NODE_ENV === 'production';
};
exports.isProduction = isProduction;
const getEnvVar = (key, defaultValue) => {
    return process.env[key] || defaultValue || '';
};
exports.getEnvVar = getEnvVar;
