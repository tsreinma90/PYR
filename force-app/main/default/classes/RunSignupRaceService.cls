public with sharing class RunSignupRaceService {

    public class RunSignupException extends Exception {}

    public class RaceSummary {
        @AuraEnabled public Integer raceId;
        @AuraEnabled public String name;
        @AuraEnabled public String city;
        @AuraEnabled public String state;
        @AuraEnabled public String nextDate;
        @AuraEnabled public String url;
        @AuraEnabled public String logoUrl;
    }

    @AuraEnabled(cacheable=true)
    public static List<RaceSummary> searchRaces(
        String zipcode,
        Integer radiusMiles,
        Date startDate,
        Date endDate,
        Decimal minDistance,
        Decimal maxDistance,
        String distanceUnits,
        String keyword,
        String sortField
    ) {
        if (String.isBlank(zipcode)) {
            throw new RunSignupException('Zip code is required.');
        }
        if (radiusMiles == null || radiusMiles <= 0) {
            radiusMiles = 50;
        }

        Date today = Date.today();
        if (startDate == null) startDate = today;
        if (endDate == null)   endDate   = today.addMonths(6);
        if (String.isBlank(distanceUnits)) {
            distanceUnits = 'K'; // "K" or "M"
        }

        // Do NOT default to "next_date" — API doesn't support it
        // We'll do date sorting in the LWC. If caller passes an invalid value,
        // we'll just ignore it when building params below.

        Http http = new Http();
        HttpRequest req = new HttpRequest();

        String baseEndpoint = 'https://api.runsignup.com/rest/races';

        // Base params (no sort here)
        Map<String, String> params = new Map<String, String>{
            'format'         => 'json',
            'api_key'        => RunSignupConfig.apiKey(),
            'api_secret'     => RunSignupConfig.apiSecret(),
            'zipcode'        => zipcode,
            'radius'         => String.valueOf(radiusMiles),
            'start_date'     => toIsoDate(startDate),
            'end_date'       => toIsoDate(endDate),
            'event_type'     => 'running_only',
            'events'         => 'T',
            'race_links'     => 'T',
            'distance_units' => distanceUnits
        };

        // Optional affiliate token: if present, RunSignup will append it
        // to all race URLs returned in the payload.
        String affiliateToken = RunSignupConfig.affiliateToken();
        if (!String.isBlank(affiliateToken)) {
            params.put('aflt_token', affiliateToken);
        }

        // Optional filters
        if (minDistance != null && minDistance > 0) {
            params.put('min_distance', String.valueOf(minDistance));
        }
        if (maxDistance != null && maxDistance > 0) {
            params.put('max_distance', String.valueOf(maxDistance));
        }
        if (!String.isBlank(keyword)) {
            params.put('search', keyword);
        }

        // ✅ Only include sort if it's one of the allowed fields
        // Valid RunSignup sort values: name, city, state, created, modified
        Set<String> validSortFields = new Set<String>{
            'name', 'city', 'state', 'created', 'modified'
        };
        if (!String.isBlank(sortField) && validSortFields.contains(sortField)) {
            params.put('sort', sortField);
        }

        // Build query string
        List<String> queryParts = new List<String>();
        for (String key : params.keySet()) {
            String value = params.get(key);
            if (value == null) continue;
            queryParts.add(key + '=' + EncodingUtil.urlEncode(value, 'UTF-8'));
        }

        String fullUrl = baseEndpoint + '?' + String.join(queryParts, '&');
        req.setEndpoint(fullUrl);
        req.setMethod('GET');

        HttpResponse res;
        try {
            res = http.send(req);
            System.debug('*** RunSignup STATUS: ' + res.getStatus() + ' / ' + res.getStatusCode());
            System.debug('*** RunSignup BODY: ' + res.getBody());
        } catch (Exception e) {
            throw new RunSignupException('Error calling RunSignup API: ' + e.getMessage());
        }

        if (res.getStatusCode() != 200) {
            throw new RunSignupException(
                'RunSignup API returned status ' + res.getStatus() + ': ' + res.getBody()
            );
        }

        Map<String, Object> root = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
        List<Object> races = (List<Object>)root.get('races');

        List<RaceSummary> results = new List<RaceSummary>();
        if (races == null) return results;

        for (Object o : races) {
            Map<String, Object> raceWrapper = (Map<String, Object>)o;
            Map<String, Object> race = (Map<String, Object>)raceWrapper.get('race');
            if (race == null) continue;

            RaceSummary r = new RaceSummary();
            r.raceId   = (Integer)race.get('race_id');
            r.name     = (String)race.get('name');
            r.nextDate = (String)race.get('next_date');
            r.url      = (String)race.get('url');      // already includes ?aflt_token=... if set
            r.logoUrl  = (String)race.get('logo_url');

            Map<String, Object> addr = (Map<String, Object>)race.get('address');
            if (addr != null) {
                r.city  = (String)addr.get('city');
                r.state = (String)addr.get('state');
            }

            results.add(r);
        }

        return results;
    }

    private static String toIsoDate(Date d) {
        Datetime dt = Datetime.newInstance(d.year(), d.month(), d.day());
        return dt.formatGMT('yyyy-MM-dd');
    }
}