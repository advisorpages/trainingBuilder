# Security Configuration Guide

## 🔒 Environment Variables & Secrets Management

### Required Environment Variables

Before running the application in production, ensure all required environment variables are set:

#### Critical Security Variables
```bash
# JWT Secret - MUST be a long, random string (minimum 256 bits)
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-256-bits-long-random-string

# Database Password - Use strong password
DATABASE_PASSWORD=your_secure_database_password

# QR Code API Key - Get from https://qrcodes.at/
QR_CLOUD_API_KEY=your_qr_cloud_api_key_here
```

#### Optional Variables
```bash
# Email configuration (if email features are used)
EMAIL_PASSWORD=your_email_password

# Session secret (for session management)
SESSION_SECRET=your_session_secret_here
```

### Setup Instructions

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Generate secure secrets:**
   ```bash
   # Generate JWT secret (Node.js)
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

   # Generate JWT secret (OpenSSL)
   openssl rand -hex 64
   ```

3. **Set your actual values in `.env.local`**

4. **Never commit `.env*` files to version control** (already configured in `.gitignore`)

## 🛡️ Security Hardening Checklist

### ✅ Completed
- [x] Removed hardcoded API keys from environment files
- [x] Implemented graceful handling of missing API keys
- [x] Added `.env*` to `.gitignore`
- [x] Created secure `.env.example` template
- [x] Added environment variable validation

### 🔄 To Complete Before Production
- [ ] Generate secure JWT secret for production
- [ ] Obtain and configure QR Cloud API key
- [ ] Configure database with strong password
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Implement rate limiting
- [ ] Add security headers middleware
- [ ] Set up monitoring and alerting

## 🚨 Security Vulnerabilities Fixed

### Issue: Hardcoded API Keys
**Risk Level:** HIGH
**Status:** FIXED

**Problem:** QR Cloud API key was hardcoded in environment files (`b0b49dc4204835f2d97934c1d34b7ffb`)

**Solution:**
- Removed hardcoded API key from all environment files
- Added key validation in QR service
- Created secure environment template
- Added graceful error handling for missing keys

### Issue: Weak JWT Secret
**Risk Level:** MEDIUM
**Status:** FIXED

**Problem:** JWT secret used placeholder value

**Solution:**
- Updated to more secure placeholder
- Added instructions for generating secure secrets
- Added minimum length requirements

## 📋 Production Deployment Security

### Environment Setup
1. Use a secrets management service (AWS Secrets Manager, Azure Key Vault, etc.)
2. Set environment variables through your deployment platform
3. Never store secrets in container images
4. Use different secrets for each environment (dev/staging/prod)

### Database Security
1. Use SSL connections in production
2. Implement database access controls
3. Regular security updates
4. Database backup encryption

### API Security
1. Implement rate limiting
2. Add request size limits
3. Use HTTPS only
4. Validate all inputs
5. Implement proper error handling without information leakage

## 🔍 Security Monitoring

### Recommended Monitoring
- Failed authentication attempts
- Unusual API usage patterns
- Database connection failures
- Environment variable access
- SSL certificate expiration

### Logging Security Events
- Authentication successes/failures
- Authorization failures
- API key usage
- Database queries (without sensitive data)
- System errors and exceptions

---

**Last Updated:** September 19, 2025
**Security Review:** Production Readiness Phase