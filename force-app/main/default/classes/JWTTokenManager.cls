/**
 * Utility class for JWT token generation and validation
 * Handles creation of stateless JWT tokens for authentication
 */
public class JWTTokenManager {

    // Token expiration: 24 hours (in seconds)
    private static final Long TOKEN_EXPIRATION = 86400;
    private static final String ALGORITHM = 'HS256';

    /**
     * Generate a JWT token for a Contact
     * @param contactId The Salesforce Contact ID
     * @param email The contact email
     * @return JWT token string
     */
    public static String generateToken(String contactId, String email) {
        Long now = DateTime.now().getTime() / 1000;
        Long expiration = now + TOKEN_EXPIRATION;

        // Create JWT payload
        Map<String, Object> payload = new Map<String, Object>();
        payload.put('sub', contactId);        // subject (Contact ID)
        payload.put('email', email);           // email claim
        payload.put('iat', now);              // issued at
        payload.put('exp', expiration);       // expiration time
        payload.put('iss', 'PYR');            // issuer

        // For MVP: Create a simple token by encoding the claims
        // In production, use a proper JWT library or Salesforce named credentials
        String tokenPayload = JSON.serialize(payload);
        String encodedPayload = EncodingUtil.base64Encode(Blob.valueOf(tokenPayload));

        // Create simple signature (salt with Contact ID and current timestamp)
        String signature = EncodingUtil.base64Encode(
            Blob.valueOf(contactId + ':' + now)
        );

        return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + encodedPayload + '.' + signature;
    }

    /**
     * Validate a JWT token
     * @param token The JWT token string
     * @return Map with validation result and decoded data
     */
    public static Map<String, Object> validateToken(String token) {
        Map<String, Object> result = new Map<String, Object>();
        result.put('valid', false);
        result.put('contactId', null);
        result.put('error', 'Invalid token');

        try {
            // Split token into parts
            List<String> parts = token.split('\\.');
            if (parts.size() != 3) {
                result.put('error', 'Token format invalid');
                return result;
            }

            // Decode payload
            String decodedPayload = EncodingUtil.urlDecode(
                EncodingUtil.base64Encode(
                    EncodingUtil.base64Decode(parts.get(1))
                ),
                'UTF-8'
            );

            Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(decodedPayload);

            // Check expiration
            Long exp = (Long) payload.get('exp');
            Long now = DateTime.now().getTime() / 1000;

            if (exp < now) {
                result.put('error', 'Token expired');
                return result;
            }

            // Validate issuer
            if (!payload.containsKey('iss') || payload.get('iss') != 'PYR') {
                result.put('error', 'Invalid issuer');
                return result;
            }

            // Token is valid
            result.put('valid', true);
            //result.put('contactId', (String) payload.get('sub'));
            
            result.put('email', (String) payload.get('email'));
            result.remove('error');

        } catch (Exception e) {
            result.put('error', 'Token validation failed: ' + e.getMessage());
        }

        return result;
    }
}
