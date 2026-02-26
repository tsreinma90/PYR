public with sharing class JWTTokenManager {

    private static final String ALG = 'HS256';
    private static final String TYP = 'JWT';

    /* =========================
       PUBLIC API
       ========================= */

    public static String generateToken(String contactId, String email) {
        PYR_JWT_Auth_Config__mdt cfg = getActiveConfig();

        Long now = DateTime.now().getTime() / 1000;
        Long exp = now + cfg.Token_Expiration_Seconds__c.longValue();

        // Header
        Map<String, Object> header = new Map<String, Object>{
            'alg' => ALG,
            'typ' => TYP
        };

        // Payload
        Map<String, Object> payload = new Map<String, Object>{
            'sub'   => contactId,
            'email' => email,
            'iss'   => cfg.Issuer__c,
            'iat'   => now,
            'exp'   => exp
        };

        String encodedHeader  = base64UrlEncode(JSON.serialize(header));
        String encodedPayload = base64UrlEncode(JSON.serialize(payload));

        String signingInput = encodedHeader + '.' + encodedPayload;
        String signature = sign(signingInput, cfg.Signing_Key__c);

        return signingInput + '.' + signature;
    }

    public static Map<String, Object> validateToken(String token) {
        Map<String, Object> result = new Map<String, Object>{
            'valid' => false
        };

        try {
            PYR_JWT_Auth_Config__mdt cfg = getActiveConfig();

            List<String> parts = token.split('\\.');
            if (parts.size() != 3) {
                result.put('error', 'Invalid JWT format');
                return result;
            }

            // Validate signature
            String signingInput = parts[0] + '.' + parts[1];
            String providedSig = parts[2];
            String expectedSig = sign(signingInput, cfg.Signing_Key__c);

            if (providedSig != expectedSig) {
                result.put('error', 'Invalid signature');
                return result;
            }

            // Decode payload
            String payloadJson =
                EncodingUtil.base64Decode(fromBase64Url(parts[1])).toString();

            Map<String, Object> payload =
                (Map<String, Object>) JSON.deserializeUntyped(payloadJson);

            Long now = DateTime.now().getTime() / 1000;
            Long tokenExp = ((Decimal) payload.get('exp')).longValue();

            if (tokenExp < now) {
                result.put('error', 'Token expired');
                return result;
            }

            if ((String) payload.get('iss') != cfg.Issuer__c) {
                result.put('error', 'Invalid issuer');
                return result;
            }

            result.put('valid', true);
            result.put('contactId', (String) payload.get('sub'));
            result.put('email', (String) payload.get('email'));
            return result;

        } catch (Exception e) {
            result.put('error', 'JWT validation failed: ' + e.getMessage());
            return result;
        }
    }

    /* =========================
       INTERNAL HELPERS
       ========================= */

    private static PYR_JWT_Auth_Config__mdt getActiveConfig() {
        PYR_JWT_Auth_Config__mdt cfg = [
            SELECT Signing_Key__c,
                   Issuer__c,
                   Token_Expiration_Seconds__c
            FROM PYR_JWT_Auth_Config__mdt
            WHERE Is_Active__c = true
            LIMIT 1
        ];

        if (cfg == null) {
            throw new SecurityException('No active JWT config found');
        }
        return cfg;
    }

    private static String sign(String data, String secret) {
        Blob mac = Crypto.generateMac(
            'HmacSHA256',
            Blob.valueOf(data),
            Blob.valueOf(secret)
        );
        return base64UrlEncode(mac);
    }

    private static String base64UrlEncode(String input) {
        return base64UrlEncode(Blob.valueOf(input));
    }

    private static String base64UrlEncode(Blob input) {
        return EncodingUtil.base64Encode(input)
            .replace('+', '-')
            .replace('/', '_')
            .replace('=', '');
    }

    private static String fromBase64Url(String input) {
        String s = input.replace('-', '+').replace('_', '/');
        while (Math.mod(s.length(), 4) != 0) {
            s += '=';
        }
        return s;
    }
}