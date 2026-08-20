# Security Vulnerabilities

## Known Vulnerabilities

### Next.js Vulnerabilities (9 total: 4 moderate, 4 high, 1 critical)

**Status:** Requires major version upgrade (14.x → 16.x) which is a breaking change.

**Affected Versions:** next@9.3.4-canary.0 through 16.3.0-preview.10

**Mitigation Strategies:**

1. **Server Components DoS (Critical)**
   - Mitigation: Rate limiting is implemented
   - Mitigation: Not using Server Actions for user input
   - Mitigation: nginx proxy limits request size

2. **Cache Poisoning (High)**
   - Mitigation: Not using i18n middleware
   - Mitigation: Using production mode (not development)
   - Mitigation: Rate limiting prevents abuse

3. **SSRF in Rewrites (High)**
   - Mitigation: Not using custom rewrites in production
   - Mitigation: API proxy only forwards to localhost

4. **XSS via CSP nonces (High)**
   - Mitigation: CSP headers configured
   - Mitigation: Not using CSP nonces

5. **Image Optimization DoS (High)**
   - Mitigation: Not using next/image optimization
   - Mitigation: Static assets served directly

**Recommendation:** Plan upgrade to Next.js 16.x in next major release cycle.

### PostCSS Vulnerabilities (4 high)

**Affected Versions:** postcss <= 8.5.22

**Mitigation:**
- Not using untrusted CSS input
- Build-time only vulnerability (not runtime)
- Upgrading PostCSS is blocked by Next.js version

### axios Vulnerabilities (10 high)

**Affected Versions:** axios 1.0.0 - 1.17.0

**Mitigation:**
- axios is a transitive dependency (via @coinbase/cdp-sdk)
- Not directly used in application code
- No user-controlled input reaches axios

## Security Hardening Applied

The following mitigations reduce the impact of known vulnerabilities:

1. **Rate Limiting:** Prevents DoS attacks
2. **Security Headers:** CSP, X-Frame-Options, HSTS
3. **Input Validation:** All user inputs validated
4. **Read-Only API:** No server-side state mutations
5. **Wallet-Signed Writes:** Server never holds private keys
6. **CORS Configuration:** Restricts cross-origin requests

## Monitoring

Run `npm audit` periodically to check for new vulnerabilities:
```bash
npm audit --audit-level=high
```

## Upgrade Path

When ready to upgrade Next.js:
1. Review Next.js 15.x and 16.x migration guides
2. Test all routes and functionality
3. Update dependencies
4. Run full test suite
5. Deploy to staging first
6. Monitor for issues
