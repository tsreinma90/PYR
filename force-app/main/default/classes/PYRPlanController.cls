/**
 * REST API Controller for Training Plan CRUD operations
 * Handles creating, reading, updating, deleting training plans
 * All endpoints require Authorization: Bearer <JWT_token> header
 *
 * Endpoints:
 * GET /services/apexrest/pyr/plans - List all plans for authenticated user
 * POST /services/apexrest/pyr/plans - Create new plan
 * GET /services/apexrest/pyr/plans/{planId} - Get specific plan
 * PUT /services/apexrest/pyr/plans/{planId} - Update plan
 * DELETE /services/apexrest/pyr/plans/{planId} - Delete plan
 */
@RestResource(urlMapping='/pyr/plans/*')
global class PYRPlanController {

    /**
     * GET /pyr/plans or /pyr/plans/{planId}
     * Lists all plans or retrieves a specific plan
     */
    @HttpGet
    global static void handleGetRequest() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        try {
            // Validate authentication
            String contactId = validateAuth(res);
            if (contactId == null) {
                return; // Error already sent by validateAuth
            }

            // Extract plan ID from URI if present
            String planId = extractPlanIdFromURI(req.requestURI);

            if (String.isNotBlank(planId)) {
                // Get single plan
                getSinglePlan(planId, contactId, res);
            } else {
                // List all plans for user
                listPlans(contactId, res);
            }

        } catch (Exception e) {
            sendErrorResponse(res, 'Server error: ' + e.getMessage(), 500);
        }
    }

    /**
     * POST /pyr/plans
     * Create a new training plan
     *
     * Request body:
     * {
     *   "name": "Boston Marathon 2024",
     *   "planJson": [...],
     *   "raceDistance": "Marathon",
     *   "raceDate": "2024-04-15",
     *   "mileageLevel": "Medium",
     *   "durationWeeks": 16
     * }
     */
    @HttpPost
    global static void handlePostRequest() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        try {
            // Validate authentication
            String contactId = validateAuth(res);
            if (contactId == null) {
                return;
            }

            // Parse request body
            Map<String, Object> requestBody = (Map<String, Object>) JSON.deserializeUntyped(
                req.requestBody.toString()
            );

            String planName = (String) requestBody.get('name');
            String planJson = (String) requestBody.get('planJson');
            String raceDistance = (String) requestBody.get('raceDistance');
            String raceDate = (String) requestBody.get('raceDate');
            String mileageLevel = (String) requestBody.get('mileageLevel');
            Object rawWeeks = requestBody.get('durationWeeks');
            Decimal durationWeeks = null;
            if (rawWeeks instanceof Decimal) {
                durationWeeks = (Decimal) rawWeeks;
            } else if (rawWeeks instanceof String && String.isNotBlank((String) rawWeeks)) {
                durationWeeks = Decimal.valueOf((String) rawWeeks);
            }

            if (String.isBlank(planName) || String.isBlank(planJson)) {
                sendErrorResponse(res, 'Missing required fields: name, planJson', 400);
                return;
            }

            if (!planJson.contains('"schemaVersion"')) {
                sendErrorResponse(res, 'Invalid training plan schema', 400);
                return;
            }

            // Create Training Plan record
            Training_Plan__c plan = new Training_Plan__c();
            plan.Name = planName;
            plan.Plan_JSON__c = planJson;
            plan.Contact__c = contactId;
            plan.Race_Distance__c = raceDistance;
            if (String.isNotBlank(raceDate)) {
                plan.Race_Date__c = Date.valueOf(raceDate);
            }
            plan.Mileage_Level__c = mileageLevel;
            plan.Duration_Weeks__c = durationWeeks;
            plan.Last_Modified__c = DateTime.now();

            insert plan;

            // Send success response
            Map<String, Object> response = new Map<String, Object>();
            response.put('success', true);
            response.put('planId', plan.Id);
            response.put('name', plan.Name);
            response.put('createdDate', plan.CreatedDate);

            res.statusCode = 201;
            res.responseBody = Blob.valueOf(JSON.serialize(response));

        } catch (Exception e) {
            sendErrorResponse(res, 'Failed to create plan: ' + e.getMessage(), 400);
        }
    }

    /**
     * PUT /pyr/plans/{planId}
     * Update an existing training plan
     */
    @HttpPut
    global static void handlePutRequest() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        try {
            // Validate authentication
            String contactId = validateAuth(res);
            if (contactId == null) {
                return;
            }

            // Extract plan ID from URI
            String planId = extractPlanIdFromURI(req.requestURI);
            if (String.isBlank(planId)) {
                sendErrorResponse(res, 'Plan ID required for update', 400);
                return;
            }

            // Verify plan ownership
            List<Training_Plan__c> plans = [
                SELECT Id, Contact__c
                FROM Training_Plan__c
                WHERE Id = :planId
                LIMIT 1
            ];

            if (plans.isEmpty()) {
                sendErrorResponse(res, 'Plan not found', 404);
                return;
            }

            if (plans[0].Contact__c != contactId) {
                sendErrorResponse(res, 'You do not have permission to update this plan', 403);
                return;
            }

            // Parse request body
            Map<String, Object> requestBody = (Map<String, Object>) JSON.deserializeUntyped(
                req.requestBody.toString()
            );

            if (!requestBody.containsKey('planJson') || String.isBlank((String) requestBody.get('planJson'))) {
                sendErrorResponse(res, 'planJson is required for update', 400);
                return;
            }

            String planJson = (String) requestBody.get('planJson');

            if (!planJson.contains('"schemaVersion"')) {
                sendErrorResponse(res, 'Invalid training plan schema', 400);
                return;
            }

            Training_Plan__c plan = plans[0];

            if (requestBody.containsKey('lastKnownModified')) {
                DateTime clientTs = DateTime.valueOf((String) requestBody.get('lastKnownModified'));
                if (plan.Last_Modified__c != null && plan.Last_Modified__c > clientTs) {
                    sendErrorResponse(res, 'Plan was modified elsewhere', 409);
                    return;
                }
            }

            if (requestBody.containsKey('name')) {
                String newName = (String) requestBody.get('name');
                if (String.isBlank(newName)) {
                    sendErrorResponse(res, 'Plan name cannot be blank', 400);
                    return;
                }
                plan.Name = newName;
            }
            plan.Plan_JSON__c = (String) requestBody.get('planJson');
            if (requestBody.containsKey('raceDistance')) {
                plan.Race_Distance__c = (String) requestBody.get('raceDistance');
            }
            if (requestBody.containsKey('raceDate')) {
                String raceDate = (String) requestBody.get('raceDate');
                plan.Race_Date__c = String.isNotBlank(raceDate) ? Date.valueOf(raceDate) : null;
            }
            if (requestBody.containsKey('mileageLevel')) {
                plan.Mileage_Level__c = (String) requestBody.get('mileageLevel');
            }
            if (requestBody.containsKey('durationWeeks')) {
                Object rawWeeksPut = requestBody.get('durationWeeks');
                if (rawWeeksPut instanceof Decimal) {
                    plan.Duration_Weeks__c = (Decimal) rawWeeksPut;
                } else if (rawWeeksPut instanceof String && String.isNotBlank((String) rawWeeksPut)) {
                    plan.Duration_Weeks__c = Decimal.valueOf((String) rawWeeksPut);
                }
            }

            plan.Last_Modified__c = DateTime.now();
            update plan;

            Map<String, Object> response = new Map<String, Object>();
            response.put('success', true);
            response.put('planId', plan.Id);
            response.put('message', 'Plan updated successfully');

            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(response));

        } catch (Exception e) {
            sendErrorResponse(res, 'Failed to update plan: ' + e.getMessage(), 400);
        }
    }

    /**
     * DELETE /pyr/plans/{planId}
     * Delete a training plan
     */
    @HttpDelete
    global static void handleDeleteRequest() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        try {
            // Validate authentication
            String contactId = validateAuth(res);
            if (contactId == null) {
                return;
            }

            // Extract plan ID from URI
            String planId = extractPlanIdFromURI(req.requestURI);
            if (String.isBlank(planId)) {
                sendErrorResponse(res, 'Plan ID required for delete', 400);
                return;
            }

            // Verify plan ownership
            List<Training_Plan__c> plans = [
                SELECT Id, Contact__c
                FROM Training_Plan__c
                WHERE Id = :planId
                LIMIT 1
            ];

            if (plans.isEmpty()) {
                sendErrorResponse(res, 'Plan not found', 404);
                return;
            }

            if (plans[0].Contact__c != contactId) {
                sendErrorResponse(res, 'You do not have permission to delete this plan', 403);
                return;
            }

            delete plans[0];

            Map<String, Object> response = new Map<String, Object>();
            response.put('success', true);
            response.put('message', 'Plan deleted successfully');

            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(response));

        } catch (Exception e) {
            sendErrorResponse(res, 'Failed to delete plan: ' + e.getMessage(), 400);
        }
    }

    /**
     * Private method: List all plans for authenticated user
     */
    private static void listPlans(String contactId, RestResponse res) {
        List<Training_Plan__c> plans = [
            SELECT Id, Name, Race_Distance__c, Race_Date__c, Mileage_Level__c,
                   Duration_Weeks__c, CreatedDate, Last_Modified__c
            FROM Training_Plan__c
            WHERE Contact__c = :contactId
            ORDER BY Last_Modified__c DESC
            LIMIT 100
        ];

        List<Map<String, Object>> plansList = new List<Map<String, Object>>();
        for (Training_Plan__c plan : plans) {
            Map<String, Object> planMap = new Map<String, Object>();
            planMap.put('id', plan.Id);
            planMap.put('name', plan.Name);
            planMap.put('raceDistance', plan.Race_Distance__c);
            planMap.put('raceDate', plan.Race_Date__c);
            planMap.put('mileageLevel', plan.Mileage_Level__c);
            planMap.put('durationWeeks', plan.Duration_Weeks__c);
            planMap.put('createdDate', plan.CreatedDate);
            planMap.put('lastModified', plan.Last_Modified__c);
            plansList.add(planMap);
        }

        Map<String, Object> response = new Map<String, Object>();
        response.put('success', true);
        response.put('plans', plansList);
        response.put('count', plansList.size());

        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(response));
    }

    /**
     * Private method: Get a single plan by ID
     */
    private static void getSinglePlan(String planId, String contactId, RestResponse res) {
        List<Training_Plan__c> plans = [
            SELECT Id, Name, Plan_JSON__c, Race_Distance__c, Race_Date__c,
                   Mileage_Level__c, Duration_Weeks__c, CreatedDate, Last_Modified__c,
                   Strava_Synced__c, Is_Public__c,
                   Training_Block__c, Peak_Weekly_Mileage__c, Goal_Race_Pace__c
            FROM Training_Plan__c
            WHERE Id = :planId AND Contact__c = :contactId
            LIMIT 1
        ];

        if (plans.isEmpty()) {
            sendErrorResponse(res, 'Plan not found', 404);
            return;
        }

        Training_Plan__c plan = plans[0];

        Map<String, Object> response = new Map<String, Object>();
        response.put('success', true);
        response.put('plan', new Map<String, Object>{
            'id' => plan.Id,
            'name' => plan.Name,
            'planJson' => plan.Plan_JSON__c,
            'raceDistance' => plan.Race_Distance__c,
            'raceDate' => plan.Race_Date__c,
            'mileageLevel' => plan.Mileage_Level__c,
            'durationWeeks' => plan.Duration_Weeks__c,
            'createdDate' => plan.CreatedDate,
            'lastModified' => plan.Last_Modified__c,
            'stravaSynced' => plan.Strava_Synced__c,
            'isPublic' => plan.Is_Public__c,
            'trainingBlock' => plan.Training_Block__c,
            'peakWeeklyMileage' => plan.Peak_Weekly_Mileage__c,
            'goalRacePace' => plan.Goal_Race_Pace__c
        });

        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(response));
    }

    /**
     * Private method: Validate JWT token from Authorization header
     * Returns Contact ID if valid, null if invalid
     */
    private static String validateAuth(RestResponse res) {
        RestRequest req = RestContext.request;
        String token = req.params.get('pyr_token');

        if (String.isBlank(token)) {
            sendErrorResponse(res, 'Missing authentication token', 401);
            return null;
        }

        Map<String, Object> validation = JWTTokenManager.validateToken(token);

        if (!(Boolean) validation.get('valid')) {
            sendErrorResponse(res, (String) validation.get('error'), 401);
            return null;
        }

        return (String) validation.get('contactId');
    }

    /**
     * Private method: Extract plan ID from request URI
     * URI format: /services/apexrest/pyr/plans/{planId}
     * Handles cases where a query string is present and is robust to extra path segments.
     */
    private static String extractPlanIdFromURI(String uri) {
        if (String.isBlank(uri)) return null;

        // Remove query string if present
        String cleanUri = uri.split('\\?')[0];

        List<String> parts = cleanUri.split('/');
        if (parts.isEmpty()) return null;

        String lastPart = parts[parts.size() - 1];
        if (String.isNotBlank(lastPart) && lastPart.toLowerCase() != 'plans') {
            return lastPart;
        }
        return null;
    }

    /**
     * Private method: Send error responses
     */
    private static void sendErrorResponse(RestResponse res, String message, Integer statusCode) {
        Map<String, Object> errorResponse = new Map<String, Object>();
        errorResponse.put('success', false);
        errorResponse.put('error', message);

        res.statusCode = statusCode;
        res.responseBody = Blob.valueOf(JSON.serialize(errorResponse));
    }
}
