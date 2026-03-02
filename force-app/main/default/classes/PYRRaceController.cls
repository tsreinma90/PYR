/**
 * REST API Controller for Race Search
 *
 * Endpoints:
 * GET  /services/apexrest/pyr/races  - Search races via RunSignup (no auth required)
 *   Params: zip, radius, startDate, endDate, minDistance, maxDistance, units, keyword, sort
 *
 * POST /services/apexrest/pyr/races  - AI filter suggestion via Agentforce (auth required)
 *   Body: { "userPrompt": "..." }
 */
@RestResource(urlMapping='/pyr/races/*')
global class PYRRaceController {

    @HttpGet
    global static void handleGet() {
        RestRequest req   = RestContext.request;
        RestResponse res  = RestContext.response;

        try {
            String zip        = req.params.get('zip');
            String radiusStr  = req.params.get('radius');
            String startStr   = req.params.get('startDate');
            String endStr     = req.params.get('endDate');
            String minDistStr = req.params.get('minDistance');
            String maxDistStr = req.params.get('maxDistance');
            String units      = req.params.get('units');
            String keyword    = req.params.get('keyword');
            String sortField  = req.params.get('sort');

            if (String.isBlank(zip)) {
                sendError(res, 'zip is required', 400);
                return;
            }

            Integer radius   = String.isBlank(radiusStr)  ? 50   : Integer.valueOf(radiusStr);
            Date startDate   = String.isBlank(startStr)   ? Date.today() : Date.valueOf(startStr);
            Date endDate     = String.isBlank(endStr)     ? Date.today().addMonths(6) : Date.valueOf(endStr);
            Decimal minDist  = String.isBlank(minDistStr) ? null : Decimal.valueOf(minDistStr);
            Decimal maxDist  = String.isBlank(maxDistStr) ? null : Decimal.valueOf(maxDistStr);
            if (String.isBlank(units)) units = 'K';

            List<RunSignupRaceService.RaceSummary> races = RunSignupRaceService.searchRaces(
                zip, radius, startDate, endDate, minDist, maxDist, units, keyword, sortField
            );

            List<Map<String, Object>> raceList = new List<Map<String, Object>>();
            for (RunSignupRaceService.RaceSummary r : races) {
                raceList.add(new Map<String, Object>{
                    'raceId'   => r.raceId,
                    'name'     => r.name,
                    'city'     => r.city,
                    'state'    => r.state,
                    'nextDate' => r.nextDate,
                    'url'      => r.url,
                    'logoUrl'  => r.logoUrl
                });
            }

            res.statusCode   = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'success' => true,
                'races'   => raceList,
                'count'   => raceList.size()
            }));

        } catch (Exception e) {
            sendError(res, e.getMessage(), 500);
        }
    }

    @HttpPost
    global static void handlePost() {
        RestRequest req   = RestContext.request;
        RestResponse res  = RestContext.response;

        try {
            // Auth required — guards Agentforce usage
            String contactId = validateAuth(res);
            if (contactId == null) return;

            Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(
                req.requestBody.toString()
            );
            String userPrompt = (String) body.get('userPrompt');

            if (String.isBlank(userPrompt)) {
                sendError(res, 'userPrompt is required', 400);
                return;
            }

            RaceFilterCoachController.Request aiReq = new RaceFilterCoachController.Request();
            aiReq.userPrompt = userPrompt;

            RaceFilterCoachController.Response aiResp = RaceFilterCoachController.suggestFilters(aiReq);

            res.statusCode   = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'success'     => true,
                'summaryText' => aiResp.summaryText,
                'filtersJson' => aiResp.filtersJson
            }));

        } catch (Exception e) {
            sendError(res, e.getMessage(), 500);
        }
    }

    private static String validateAuth(RestResponse res) {
        String token = RestContext.request.params.get('pyr_token');
        if (String.isBlank(token)) {
            sendError(res, 'Missing authentication token', 401);
            return null;
        }
        Map<String, Object> validation = JWTTokenManager.validateToken(token);
        if (!(Boolean) validation.get('valid')) {
            sendError(res, (String) validation.get('error'), 401);
            return null;
        }
        return (String) validation.get('contactId');
    }

    private static void sendError(RestResponse res, String message, Integer statusCode) {
        res.statusCode   = statusCode;
        res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
            'success' => false,
            'error'   => message
        }));
    }
}
