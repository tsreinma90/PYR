public class RunSignupConfig {

    private static RunSignup_Config__mdt getConfig() {
        List<RunSignup_Config__mdt> listCfg = [
            SELECT API_Key__c, API_Secret__c, Affiliate_Token__c
            FROM RunSignup_Config__mdt
            WHERE Is_Active__c = TRUE
            LIMIT 1
        ];

        if (listCfg.isEmpty()) {
            System.debug('No active RunSignup config found.');
        }

        return listCfg[0];
    }

    public static String apiKey() {
        return getConfig().API_Key__c;
    }

    public static String apiSecret() {
        return getConfig().API_Secret__c;
    }

    public static String affiliateToken() {
        return getConfig().Affiliate_Token__c;
    }
}