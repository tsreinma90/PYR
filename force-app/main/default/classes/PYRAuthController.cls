/**
 * REST API Controller for PYR authentication
 * Handles Google and Apple OAuth flows, JWT token generation
 *
 * Endpoints:
 * POST /services/apexrest/pyr/auth/google
 * POST /services/apexrest/pyr/auth/apple
 * POST /services/apexrest/pyr/auth/validate
 * GET /services/apexrest/pyr/auth/me
 */
@RestResource(urlMapping='/pyr/auth/*')
global class PYRAuthController {

    /**
     * POST /pyr/auth/google
     * Exchange Google OAuth code for JWT token
     *
     * Request body:
     * {
     *   "code": "google_auth_code",
     *   "clientId": "your-client-id.apps.googleusercontent.com"
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "token": "jwt_token",
     *   "email": "user@gmail.com",
     *   "userId": "contact_id"
     * }
     */
    @HttpPost
    global static void handlePostRequest() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        try {
            // Parse request body
            Map<String, Object> requestBody = (Map<String, Object>) JSON.deserializeUntyped(
                req.requestBody.toString()
            );

            String endpoint = req.requestURI.substringAfterLast('/');

            if (endpoint == 'google') {
                handleGoogleAuth(requestBody, res);
            } else if (endpoint == 'apple') {
                handleAppleAuth(requestBody, res);
            } else if (endpoint == 'validate') {
                handleValidateToken(requestBody, res);
            } else {
                sendErrorResponse(res, 'Invalid endpoint', 400);
            }

        } catch (Exception e) {
            sendErrorResponse(res, 'Server error: ' + e.getMessage(), 500);
        }
    }

    /**
     * GET /pyr/auth/me
     * Get current authenticated user information
     * Requires Authorization: Bearer <token> header
     */
    @HttpGet
    global static void handleGetRequest() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        try {
            String authHeader = req.headers.get('Authorization');
            if (String.isBlank(authHeader) || !authHeader.startsWith('Bearer ')) {
                sendErrorResponse(res, 'Missing or invalid Authorization header', 401);
                return;
            }

            String token = authHeader.substring(7);
            Map<String, Object> validation = JWTTokenManager.validateToken(token);

            if (!(Boolean) validation.get('valid')) {
                sendErrorResponse(res, (String) validation.get('error'), 401);
                return;
            }

            String contactId = (String) validation.get('contactId');
            Contact contact = [
                SELECT Id, Email, FirstName, LastName, PYR_User_ID__c
                FROM Contact
                WHERE Id = :contactId
                LIMIT 1
            ];

            Map<String, Object> response = new Map<String, Object>();
            response.put('success', true);
            response.put('userId', contact.Id);
            response.put('pyrUserId', contact.PYR_User_ID__c);
            response.put('email', contact.Email);
            response.put('firstName', contact.FirstName);
            response.put('lastName', contact.LastName);

            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(response));

        } catch (Exception e) {
            sendErrorResponse(res, 'Server error: ' + e.getMessage(), 500);
        }
    }

    /**
     * Handle Google OAuth flow
     * In production, verify the ID token with Google's API
     * For MVP, we trust the token (HTTPS only)
     */
    private static void handleGoogleAuth(Map<String, Object> requestBody, RestResponse res) {
        String code = (String) requestBody.get('code');
        String idToken = (String) requestBody.get('idToken');

        if (String.isBlank(code) && String.isBlank(idToken)) {
            sendErrorResponse(res, 'Missing code or idToken', 400);
            return;
        }

        try {
            // For MVP: Decode the ID token (in production, verify with Google)
            // ID token is a JWT: header.payload.signature
            String token = String.isNotBlank(idToken) ? idToken : code;

            // Decode the JWT payload (base64url encoded)
            List<String> parts = token.split('\\.');
            if (parts.size() < 2) {
                sendErrorResponse(res, 'Invalid token format', 400);
                return;
            }

            // Convert base64url to standard base64, then add padding
            String b64 = parts.get(1).replace('-', '+').replace('_', '/');
            Integer mod = Math.mod(b64.length(), 4);
            if (mod == 2) b64 += '==';
            else if (mod == 3) b64 += '=';
            String decodedPayload = EncodingUtil.base64Decode(b64).toString();

            Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(decodedPayload);

            String googleId = (String) payload.get('sub');
            String email = (String) payload.get('email');

            if (String.isBlank(googleId) || String.isBlank(email)) {
                sendErrorResponse(res, 'Missing email or sub in token', 400);
                return;
            }

            // Find or create Contact
            Contact contact = findOrCreateContactByGoogle(googleId, email);

            // Generate JWT token
            String jwtToken = JWTTokenManager.generateToken(contact.Id, contact.Email);

            // Update last login
            contact.PYR_Last_Login__c = DateTime.now();
            update contact;

            // Send success response
            Map<String, Object> response = new Map<String, Object>();
            response.put('success', true);
            response.put('token', jwtToken);
            response.put('email', contact.Email);
            response.put('userId', contact.Id);
            response.put('pyrUserId', contact.PYR_User_ID__c);

            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(response));

        } catch (Exception e) {
            sendErrorResponse(res, 'Google auth failed: ' + e.getMessage(), 400);
        }
    }

    /**
     * Handle Apple OAuth flow
     * Similar to Google, but with Apple ID token
     */
    private static void handleAppleAuth(Map<String, Object> requestBody, RestResponse res) {
        String identityToken = (String) requestBody.get('identityToken');

        if (String.isBlank(identityToken)) {
            sendErrorResponse(res, 'Missing identityToken', 400);
            return;
        }

        try {
            // Decode the JWT payload (base64url encoded)
            List<String> parts = identityToken.split('\\.');
            if (parts.size() < 2) {
                sendErrorResponse(res, 'Invalid token format', 400);
                return;
            }

            // Convert base64url to standard base64, then add padding
            String b64 = parts.get(1).replace('-', '+').replace('_', '/');
            Integer mod = Math.mod(b64.length(), 4);
            if (mod == 2) b64 += '==';
            else if (mod == 3) b64 += '=';
            String decodedPayload = EncodingUtil.base64Decode(b64).toString();

            Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(decodedPayload);

            String appleId = (String) payload.get('sub');
            String email = (String) payload.get('email');

            if (String.isBlank(appleId)) {
                sendErrorResponse(res, 'Missing sub in token', 400);
                return;
            }

            // Apple may not return email on first login; use a default if missing
            if (String.isBlank(email)) {
                email = appleId + '@privaterelay.appleid.com';
            }

            // Find or create Contact
            Contact contact = findOrCreateContactByApple(appleId, email);

            // Generate JWT token
            String jwtToken = JWTTokenManager.generateToken(contact.Id, contact.Email);

            // Update last login
            contact.PYR_Last_Login__c = DateTime.now();
            update contact;

            Map<String, Object> response = new Map<String, Object>();
            response.put('success', true);
            response.put('token', jwtToken);
            response.put('email', contact.Email);
            response.put('userId', contact.Id);
            response.put('pyrUserId', contact.PYR_User_ID__c);

            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(response));

        } catch (Exception e) {
            sendErrorResponse(res, 'Apple auth failed: ' + e.getMessage(), 400);
        }
    }

    /**
     * Validate a JWT token
     * POST body: { "token": "jwt_token" }
     */
    private static void handleValidateToken(Map<String, Object> requestBody, RestResponse res) {
        String token = (String) requestBody.get('token');

        if (String.isBlank(token)) {
            sendErrorResponse(res, 'Missing token', 400);
            return;
        }

        Map<String, Object> validation = JWTTokenManager.validateToken(token);

        if ((Boolean) validation.get('valid')) {
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(validation));
        } else {
            sendErrorResponse(res, (String) validation.get('error'), 401);
        }
    }

    /**
     * Find existing Contact by Google ID or create new one
     */
    private static Contact findOrCreateContactByGoogle(String googleId, String email) {
        List<Contact> existing = [
            SELECT Id, Email, PYR_User_ID__c
            FROM Contact
            WHERE PYR_Google_ID__c = :googleId
            LIMIT 1
        ];

        if (!existing.isEmpty()) {
            return existing[0];
        }

        // Create new Contact
        Contact contact = new Contact();
        contact.Email = email;
        contact.LastName = email.contains('@') ? email.substringBefore('@') : email;
        contact.PYR_Google_ID__c = googleId;
        contact.PYR_Auth_Provider__c = 'Google';
        contact.PYR_User_ID__c = generateUUID();

        insert contact;
        return contact;
    }

    /**
     * Find existing Contact by Apple ID or create new one
     */
    private static Contact findOrCreateContactByApple(String appleId, String email) {
        List<Contact> existing = [
            SELECT Id, Email, PYR_User_ID__c
            FROM Contact
            WHERE PYR_Apple_ID__c = :appleId
            LIMIT 1
        ];

        if (!existing.isEmpty()) {
            return existing[0];
        }

        // Create new Contact
        Contact contact = new Contact();
        contact.Email = email;
        contact.LastName = email.contains('@') ? email.substringBefore('@') : 'AppleUser';
        contact.PYR_Apple_ID__c = appleId;
        contact.PYR_Auth_Provider__c = 'Apple';
        contact.PYR_User_ID__c = generateUUID();

        insert contact;
        return contact;
    }

    /**
     * Generate a UUID for the user
     */
    private static String generateUUID() {
        String chars = '0123456789ABCDEF';
        String uuid = '';

        for (Integer i = 0; i < 36; i++) {
            if (i == 8 || i == 13 || i == 18 || i == 23) {
                uuid += '-';
            } else if (i == 14) {
                uuid += '4';
            } else if (i == 19) {
                Integer idx = Math.mod(Math.abs(Crypto.getRandomInteger()), 4) + 8;
                uuid += chars.substring(idx, idx + 1);
            } else {
                Integer idx = Math.mod(Math.abs(Crypto.getRandomInteger()), 16);
                uuid += chars.substring(idx, idx + 1);
            }
        }

        return uuid;
    }

    /**
     * Helper method to send error responses
     */
    private static void sendErrorResponse(RestResponse res, String message, Integer statusCode) {
        Map<String, Object> errorResponse = new Map<String, Object>();
        errorResponse.put('success', false);
        errorResponse.put('error', message);

        res.statusCode = statusCode;
        res.responseBody = Blob.valueOf(JSON.serialize(errorResponse));
    }
}
