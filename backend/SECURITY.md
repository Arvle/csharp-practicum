# Security Guidelines for C# Practicum

## 🔐 Production Checklist

### Before Deploying to Production

1. **Generate Secure JWT Secret**
   ```bash
   cd backend
   go run cmd/generate-secret
   ```
   Copy the output and set it in your `.env` file as `JWT_SECRET=<value>`

2. **Change Teacher Access Code**
   - Set a strong, unique `TEACHER_ACCESS_CODE` in production
   - Use at least 32 characters with mixed case, numbers, and symbols

3. **Enable HTTPS**
   - Use a reverse proxy (nginx, Traefik, or Caddy) with Let's Encrypt
   - Never run the API server directly exposed to the internet
   - Set `FRONTEND_URL` to your HTTPS frontend URL

4. **Configure CORS Properly**
   - Set `ALLOWED_ORIGINS` to only your production frontend domain
   - Example: `ALLOWED_ORIGINS=["https://yourdomain.com"]`

5. **Database Security**
   - Use a strong password for PostgreSQL
   - Never use default credentials (`postgres:postgres`)
   - Enable SSL for database connections in production
   - Set `DATABASE_URL` with `sslmode=require`

6. **Rate Limiting**
   - Adjust `RATE_LIMIT_REQUESTS_PER_SECOND` based on expected traffic
   - Consider using Redis-based rate limiting for multi-instance deployments

7. **Environment Variables**
   - Never commit `.env` files to version control
   - Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Rotate secrets regularly

## 🛡️ Security Features Implemented

### Authentication
- **Password Hashing**: bcrypt with default cost factor
- **JWT Tokens**: HS256 signed with configurable expiration
- **Secure Token Generation**: Cryptographically secure random tokens
- **Role-Based Access Control**: Student and Teacher roles with strict permissions

### Input Validation
- **Student ID Validation**: 3-20 alphanumeric characters
- **Group Name Validation**: 3-30 characters with hyphens allowed
- **Request Body Validation**: Strict JSON parsing with error handling

### Rate Limiting
- **IP-Based Rate Limiting**: 10 requests/second with burst of 20 (configurable)
- **Token Bucket Algorithm**: Fair rate limiting across all IPs

### Error Handling
- **Structured Error Responses**: Consistent error format with codes and messages
- **Panic Recovery**: Automatic recovery from panics with stack trace logging
- **No Information Leakage**: Generic error messages to prevent information disclosure

### Database Security
- **Parameterized Queries**: All SQL queries use parameterized statements
- **SQL Injection Prevention**: No raw SQL concatenation
- **Column-Level Security**: Password hashes stored separately

## ⚠️ Known Security Limitations

### Code Execution Sandbox
**Current State**: C# code execution has NO sandboxing beyond process timeout.

**Risks**:
- Submitted code can access the filesystem
- Network access is not restricted
- Resource exhaustion possible (mitigated by timeout)

**Recommendations for Production**:
1. **Docker-based Isolation** (Recommended)
   - Run code execution in ephemeral Docker containers
   - Use Docker security profiles (AppArmor, seccomp)
   - Limit container resources (CPU, memory, network)

2. **gVisor/Firecracker** (High Security)
   - Use gVisor for kernel-level isolation
   - Firecracker VMs for maximum security

3. **Resource Limits**
   - Set strict timeouts (currently 30 seconds)
   - Limit memory usage
   - Disable network access in compilation environment

### Student Authentication
**Current State**: Students login by ID only (no password required initially).

**Behavior**:
- First login: No password required (teacher pre-seeds students)
- After password is set: Password required for subsequent logins

**Recommendation**: Teachers should set initial passwords for all students before they log in.

## 🔍 Audit Trail

### Logging
- All authentication attempts are logged
- Code execution attempts logged
- Grade changes logged with teacher ID
- Assignment CRUD operations logged

### Monitoring Recommendations
1. Set up alerting for:
   - Failed login attempts (>10 per minute)
   - Rate limit violations
   - Code execution timeouts
   - Database connection pool exhaustion

2. Monitor:
   - API response times
   - Error rates by endpoint
   - Active user sessions
   - Database query performance

## 📋 Compliance

### Data Protection
- **GDPR**: Student data is minimal (ID, name, group)
- **Data Retention**: Implement cleanup policies for old submissions
- **Right to Deletion**: Add endpoint to delete student data on request

### Best Practices
- [x] Password hashing (bcrypt)
- [x] JWT token expiration
- [x] HTTPS support (via reverse proxy)
- [x] Input validation
- [x] Rate limiting
- [x] SQL injection prevention
- [x] CORS configuration
- [x] Security headers
- [ ] Content Security Policy (frontend)
- [ ] Subresource Integrity (frontend)
- [ ] Automated security testing
- [ ] Dependency vulnerability scanning

## 🚨 Incident Response

### If a Secret is Compromised
1. Rotate `JWT_SECRET` immediately (all users will need to re-login)
2. Change `TEACHER_ACCESS_CODE`
3. Review logs for unauthorized access
4. Notify affected users

### If Code Execution is Exploited
1. Review execution logs for malicious code
2. Check server filesystem for unauthorized changes
3. Restart compilation service
4. Implement stronger sandboxing

## 📞 Security Contacts

Report security vulnerabilities to: [Your Security Email]

Do NOT open a public issue for security vulnerabilities.
