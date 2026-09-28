// Phase 21: Now Assist Guardian on the 9 BCFA Now Assist skill capabilities
// only. Instance-wide Guardian settings (shared demo instance) are NOT
// changed. Per capability, through the Guardian control "Trustbuilder
// (Capability)":
//   Execution Mode (Capability)    request_and_response
//   Prompt Injection (Capability)  BLOCK
//   Offensiveness (Capability)     BLOCK
// Idempotent: existing rows are updated to these values.
(function configureGuardianForBcfa() {
    var CONTROL = 'f27098857f0b8210ee61def20d866587';                  // Trustbuilder (Capability)
    var SETTINGS = {
        '1e6b36d37ff052105e0f2334dc86652f': 'request_and_response',    // Execution Mode (Capability)
        'd6f6624d7f3452105e0f2334dc866526': 'BLOCK',                   // Prompt Injection (Capability)
        '48f058c57f0b8210ee61def20d866599': 'BLOCK'                    // Offensiveness (Capability)
    };
    var CAPABILITIES = {
        bf551f4a3b2f03104035a50864e45a39: 'ap_invoice_summary',
        '9e56ef863bef03104035a50864e45af8': 'ap_match_exception_explanation',
        '3f822056eb2b4310311dff0dcad0cda4': 'ap_recommended_next_action',
        d325e8daeb2b4310311dff0dcad0cd56: 'ap_clarification_draft',
        f707a812eb6b4310311dff0dcad0cdb4: 'cash_application_summary',
        f78e64d2ebab4310311dff0dcad0cd40: 'ar_match_explanation',
        '96afe496ebab4310311dff0dcad0cd50': 'ar_residual_explanation',
        e860f81aebab4310311dff0dcad0cd20: 'ar_recommended_next_action',
        '3d2130daebab4310311dff0dcad0cd48': 'customer_clarification_draft'
    };
    var report = [];
    for (var capabilityId in CAPABILITIES) {
        var capability = new GlideRecord('sys_one_extend_capability');
        if (!capability.get(capabilityId)) { report.push(CAPABILITIES[capabilityId] + ' MISSING'); continue; }
        var data = new GlideRecord('sys_gen_ai_control_data');
        data.addQuery('control', CONTROL);
        data.addQuery('target', capabilityId);
        data.query();
        if (!data.next()) {
            data.initialize();
            data.setValue('control', CONTROL);
            data.setValue('target_type', 'sys_one_extend_capability');
            data.setValue('target', capabilityId);
            data.setValue('name', 'BCFA ' + capability.getValue('name'));
            data.setValue('description', 'Now Assist Guardian for the BCFA skill ' + CAPABILITIES[capabilityId] + ' (Phase 21).');
            data.setValue('active', true);
            data.insert();
        }
        var values = [];
        for (var settingId in SETTINGS) {
            var value = new GlideRecord('sys_gen_ai_control_setting_data');
            value.addQuery('control_data', data.getUniqueValue());
            value.addQuery('control_setting', settingId);
            value.query();
            if (!value.next()) {
                value.initialize();
                value.setValue('control_data', data.getUniqueValue());
                value.setValue('control_setting', settingId);
            }
            value.setValue('value', SETTINGS[settingId]);
            value.setValue('active', true);
            if (value.isNewRecord()) value.insert(); else value.update();
            values.push(SETTINGS[settingId]);
        }
        report.push(CAPABILITIES[capabilityId] + '=' + values.join('/'));
    }
    gs.info('BCFA_GUARDIAN ' + report.join(', '));
})();
