public with sharing class RaceFilterCoachController {
    
    // Reuse the same agent + action as your TrainingPlanReviewController
    private static final String RACE_AGENT_API_NAME    = 'Training_Plan_Coach';
    private static final String RACE_AGENT_ACTION_NAME = 'generateAiAgentResponse';
    
    public class Request {
        @AuraEnabled public String userPrompt { get; set; }
    }
    
    public class Response {
        @AuraEnabled public String summaryText    { get; set; }
        @AuraEnabled public String rawAgentOutput { get; set; }
        
        // NEW: machine-readable filters JSON extracted from the response
        @AuraEnabled public String filtersJson    { get; set; }
    }
    
    @AuraEnabled(cacheable=false)
    public static Response suggestFilters(Request req) {
        System.debug('*** RaceFilterCoach request: ' + JSON.serialize(req));
        
        if (String.isBlank(req.userPrompt)) {
            throw new AuraHandledException('Please describe what kind of race you are looking for.');
        }
        
        String userMessage =
            'The user is describing the kind of running race they want to search for. ' +
            'Your job is to help them turn this into specific search filters: ' +
            'zip code or region, search radius, date window, distance range, terrain/type keywords, and any special notes. ' +
            'You MUST respond using the format described in your topic instructions, including a JSON block that can be parsed by a system.' +
            '\n\nUser description:\n' + req.userPrompt;
        
        Invocable.Action action =
            Invocable.Action.createCustomAction(RACE_AGENT_ACTION_NAME, RACE_AGENT_API_NAME);
        
        action.setInvocationParameter('userMessage', userMessage);
        
        List<Invocable.Action.Result> results = action.invoke();
        if (results.isEmpty()) {
            throw new AuraHandledException('No response returned from Agentforce (Race Filter Coach).');
        }
        
        Invocable.Action.Result result = results.get(0);
        
        if (!result.isSuccess()) {
            List<String> msgs = new List<String>();
            for (Invocable.Action.Error e : result.getErrors()) {
                msgs.add(e.getMessage());
            }
            throw new AuraHandledException('Error invoking race filter coach: ' + String.join(msgs, '; '));
        }
        
        Map<String, Object> outVars = result.getOutputParameters();
        System.debug('*** race filter coach outVars: ' + JSON.serialize(outVars));
        
        Response resp = new Response();
        
        String agentResponseJson = (String) outVars.get('agentResponse');
        if (agentResponseJson != null) {
            Map<String, Object> agentResp =
                (Map<String, Object>) JSON.deserializeUntyped(agentResponseJson);
            String valueText = (String) agentResp.get('value');
            
            resp.summaryText    = valueText;
            resp.rawAgentOutput = agentResponseJson;
            
            // Try to extract the JSON block from the text
            String filtersJson = extractJsonBlock(valueText);
            if (filtersJson != null) {
                // Validate it's real JSON
                try {
                    Object parsed = JSON.deserializeUntyped(filtersJson);
                    if (parsed instanceof Map<String, Object>) {
                        resp.filtersJson = filtersJson;
                    }
                } catch (Exception e) {
                    System.debug('*** Failed to parse filtersJson: ' + e.getMessage());
                }
            }
        } else {
            resp.summaryText    = (String) outVars.get('summary_text');
            resp.rawAgentOutput = JSON.serialize(outVars);
            resp.filtersJson    = null;
        }
        
        return resp;
    }
    
    // Naive helper: find the first {...} block and return it
    // (works with your "JSON:" section as long as there is a single top-level object)
    private static String extractJsonBlock(String text) {
        if (String.isBlank(text)) return null;
        
        Integer jsonStart = text.indexOf('{');
        Integer jsonEnd   = text.lastIndexOf('}');
        
        if (jsonStart == -1 || jsonEnd == -1 || jsonEnd <= jsonStart) {
            return null;
        }
        
        String candidate = text.substring(jsonStart, jsonEnd + 1);
        return candidate;
    }
}