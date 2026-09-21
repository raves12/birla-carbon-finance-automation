import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    'acl-create-ap-approval': {
                        table: 'sys_security_acl'
                        id: '656592e418c346938ae0a3da15134e7f'
                    }
                    'acl-create-ap-invoice': {
                        table: 'sys_security_acl'
                        id: '210a4ad048264094bdbeeb5fdfc5844c'
                    }
                    'acl-create-ar-approval': {
                        table: 'sys_security_acl'
                        id: 'aba58e17a9e94c2a880b87da9a863971'
                    }
                    'acl-create-payment': {
                        table: 'sys_security_acl'
                        id: 'c392bf144fbc47cfade2aa5fe0d229f2'
                    }
                    'acl-create-x_695068_bcfa_ap_exception': {
                        table: 'sys_security_acl'
                        id: '096613b31c6b44939e4b1f0f77ed8bdf'
                    }
                    'acl-create-x_695068_bcfa_ap_extraction': {
                        table: 'sys_security_acl'
                        id: '16b882b598174209b9f03740f909d8b6'
                    }
                    'acl-create-x_695068_bcfa_ap_invoice_line': {
                        table: 'sys_security_acl'
                        id: 'f6a9335063fb4f71944d32643a3b417d'
                    }
                    'acl-create-x_695068_bcfa_ap_match': {
                        table: 'sys_security_acl'
                        id: '12f4ad253d554352ab0a05e0576730fa'
                    }
                    'acl-create-x_695068_bcfa_ar_exception': {
                        table: 'sys_security_acl'
                        id: '51784c1c72674738ab8bd18f3cafad70'
                    }
                    'acl-create-x_695068_bcfa_ar_open_item': {
                        table: 'sys_security_acl'
                        id: '01be26244720441f8b35fc49276a89d6'
                    }
                    'acl-create-x_695068_bcfa_credit_note': {
                        table: 'sys_security_acl'
                        id: '3a5bc2a915f246a1a5082dea10a03ea5'
                    }
                    'acl-create-x_695068_bcfa_customer': {
                        table: 'sys_security_acl'
                        id: '5794610847894c0cbf3d590cfb4b94a2'
                    }
                    'acl-create-x_695068_bcfa_deduction': {
                        table: 'sys_security_acl'
                        id: '4cf611f9f5de4b05976f87d42ac443bb'
                    }
                    'acl-create-x_695068_bcfa_finance_intake': {
                        table: 'sys_security_acl'
                        id: '050e3ac6cb7d4ce38612921c17872d46'
                    }
                    'acl-create-x_695068_bcfa_match_candidate': {
                        table: 'sys_security_acl'
                        id: '60f57bd780674e16b527c38a48cbc82e'
                    }
                    'acl-create-x_695068_bcfa_payment_allocation': {
                        table: 'sys_security_acl'
                        id: 'cc213a4fc5e143f68c7bb2b4917d132c'
                    }
                    'acl-create-x_695068_bcfa_po_line': {
                        table: 'sys_security_acl'
                        id: '2493da00091a4402a52909bba343d167'
                    }
                    'acl-create-x_695068_bcfa_purchase_order': {
                        table: 'sys_security_acl'
                        id: '6e927aab17524583ac6e3549985e6968'
                    }
                    'acl-create-x_695068_bcfa_receipt': {
                        table: 'sys_security_acl'
                        id: '00f8486d465045a6a28a69dea22a3077'
                    }
                    'acl-create-x_695068_bcfa_remittance': {
                        table: 'sys_security_acl'
                        id: 'b743afbaea1a49048f942e6d8b6ec8af'
                    }
                    'acl-create-x_695068_bcfa_vendor': {
                        table: 'sys_security_acl'
                        id: '3a2f384a1f6244f68a801537a336a2a5'
                    }
                    'acl-read-ap-approval': {
                        table: 'sys_security_acl'
                        id: 'c39b37d54b874cd5bfe8e3f3ee6d5bba'
                    }
                    'acl-read-ar-approval': {
                        table: 'sys_security_acl'
                        id: 'f3bea3e6ce79409986fdd080caf698bd'
                    }
                    'acl-read-integration-profile': {
                        table: 'sys_security_acl'
                        id: 'd2e027fe66ef4cf08ef4ab001ddda1d5'
                    }
                    'acl-read-reference-mapping': {
                        table: 'sys_security_acl'
                        id: 'd641e8a7ecde48d6b7aae9d17768dfd9'
                    }
                    'acl-read-x_695068_bcfa_ai_interaction': {
                        table: 'sys_security_acl'
                        id: 'a257264a9d9f49bf9db8760b2286c6aa'
                    }
                    'acl-read-x_695068_bcfa_ap_exception': {
                        table: 'sys_security_acl'
                        id: '767651e4e78945b29b70c9fb458937db'
                    }
                    'acl-read-x_695068_bcfa_ap_extraction': {
                        table: 'sys_security_acl'
                        id: '07bad3145d774d169a165550dbec5132'
                    }
                    'acl-read-x_695068_bcfa_ap_invoice': {
                        table: 'sys_security_acl'
                        id: '809a8beda06447cab66c275294eea951'
                    }
                    'acl-read-x_695068_bcfa_ap_invoice_line': {
                        table: 'sys_security_acl'
                        id: 'e63e14a739c143dcb4f2761f30e7c0bf'
                    }
                    'acl-read-x_695068_bcfa_ap_match': {
                        table: 'sys_security_acl'
                        id: '9772832986ee4b3db736de1a9a377737'
                    }
                    'acl-read-x_695068_bcfa_ar_exception': {
                        table: 'sys_security_acl'
                        id: '2808bd04e43b4244984a91384e6b4694'
                    }
                    'acl-read-x_695068_bcfa_ar_open_item': {
                        table: 'sys_security_acl'
                        id: '632df7f0b6d246e49946a2cce8c2b8db'
                    }
                    'acl-read-x_695068_bcfa_audit_event': {
                        table: 'sys_security_acl'
                        id: '9872a75472714b048f105785d5354527'
                    }
                    'acl-read-x_695068_bcfa_credit_note': {
                        table: 'sys_security_acl'
                        id: '446fa06efbe5462186aa643f1c0bdb88'
                    }
                    'acl-read-x_695068_bcfa_customer': {
                        table: 'sys_security_acl'
                        id: '2a4af0c45dbb4bee9f3d9e70f683ca81'
                    }
                    'acl-read-x_695068_bcfa_customer_alias': {
                        table: 'sys_security_acl'
                        id: '3bb5f2cb93cb48dfa4cf9a37e20f9946'
                    }
                    'acl-read-x_695068_bcfa_decision_log': {
                        table: 'sys_security_acl'
                        id: '99641f184ef048ac8fca75079cb31a01'
                    }
                    'acl-read-x_695068_bcfa_deduction': {
                        table: 'sys_security_acl'
                        id: 'f4f04fad2c224be78671c6c12a032003'
                    }
                    'acl-read-x_695068_bcfa_finance_exception': {
                        table: 'sys_security_acl'
                        id: 'd32c1b8bcefd4b2894a3ce7ac8036ac2'
                    }
                    'acl-read-x_695068_bcfa_finance_intake': {
                        table: 'sys_security_acl'
                        id: 'd04d1fab72c048a1aa3da6db20c8db5e'
                    }
                    'acl-read-x_695068_bcfa_integration_txn': {
                        table: 'sys_security_acl'
                        id: '0d26f90a165942f8b16b46948adb7d88'
                    }
                    'acl-read-x_695068_bcfa_match_candidate': {
                        table: 'sys_security_acl'
                        id: 'e94b991c4b954494b225f3a86a9a7eb8'
                    }
                    'acl-read-x_695068_bcfa_payment': {
                        table: 'sys_security_acl'
                        id: 'ee6e1403798f4fef8533f0abcecd1895'
                    }
                    'acl-read-x_695068_bcfa_payment_allocation': {
                        table: 'sys_security_acl'
                        id: '87c6a912c317412e9cc92697f62124c3'
                    }
                    'acl-read-x_695068_bcfa_po_line': {
                        table: 'sys_security_acl'
                        id: '48658a85a5bd428b916c59a1e8fe5999'
                    }
                    'acl-read-x_695068_bcfa_purchase_order': {
                        table: 'sys_security_acl'
                        id: '3366e1b1b362415eb5ca04148fb4aab3'
                    }
                    'acl-read-x_695068_bcfa_receipt': {
                        table: 'sys_security_acl'
                        id: 'dbe1a721f3a34d8b8578c5bd66ff82b3'
                    }
                    'acl-read-x_695068_bcfa_remittance': {
                        table: 'sys_security_acl'
                        id: '3cd32ab37fcb4ac0b26d66f71cc67b56'
                    }
                    'acl-read-x_695068_bcfa_vendor': {
                        table: 'sys_security_acl'
                        id: '7cff9e3ec5c84580af58603082596ac2'
                    }
                    'acl-write-ap-approval-decision': {
                        table: 'sys_security_acl'
                        id: '32ba172e87a347538c62c40d953598ea'
                    }
                    'acl-write-ap-invoice': {
                        table: 'sys_security_acl'
                        id: 'c4fe66868db849a68727cc00bd76381d'
                    }
                    'acl-write-ar-approval-decision': {
                        table: 'sys_security_acl'
                        id: 'c226c71d92d74ee6ad4b42d7acc26303'
                    }
                    'acl-write-integration-profile': {
                        table: 'sys_security_acl'
                        id: '0dc596ee317640a8a854239ece6e4581'
                    }
                    'acl-write-integration-txn': {
                        table: 'sys_security_acl'
                        id: '389ff39dc4c940a0ab7496f8f6c433d9'
                    }
                    'acl-write-payment': {
                        table: 'sys_security_acl'
                        id: 'd7fef0b814bf4ef9ac5cd0b78a84a3d7'
                    }
                    'acl-write-reference-mapping': {
                        table: 'sys_security_acl'
                        id: '1be52f29a4e24342b804bd5ff66ecb20'
                    }
                    'acl-write-x_695068_bcfa_ap_exception': {
                        table: 'sys_security_acl'
                        id: 'e34907d73fb04d388c55e0e99e602c82'
                    }
                    'acl-write-x_695068_bcfa_ap_extraction': {
                        table: 'sys_security_acl'
                        id: '740ba163761147cc987137d848adb11d'
                    }
                    'acl-write-x_695068_bcfa_ap_invoice_line': {
                        table: 'sys_security_acl'
                        id: 'd0945417b2614665ab0ded3deff07c5b'
                    }
                    'acl-write-x_695068_bcfa_ap_match': {
                        table: 'sys_security_acl'
                        id: '954ca23894b146ea98f02a80eb482a85'
                    }
                    'acl-write-x_695068_bcfa_ar_exception': {
                        table: 'sys_security_acl'
                        id: 'd093bf86a04348eb9af642a988e41092'
                    }
                    'acl-write-x_695068_bcfa_ar_open_item': {
                        table: 'sys_security_acl'
                        id: '6f526450085c42bbaf2d25c61d0d4d2f'
                    }
                    'acl-write-x_695068_bcfa_credit_note': {
                        table: 'sys_security_acl'
                        id: '4cb90e66103b475695e511079dd91a65'
                    }
                    'acl-write-x_695068_bcfa_customer': {
                        table: 'sys_security_acl'
                        id: '83515683fa874c0ca534bb5862a102da'
                    }
                    'acl-write-x_695068_bcfa_customer_alias': {
                        table: 'sys_security_acl'
                        id: '22c841fbf736425e9f5dc93fec3c7589'
                    }
                    'acl-write-x_695068_bcfa_deduction': {
                        table: 'sys_security_acl'
                        id: 'acc1f8c84c364def8463a558e1163fd2'
                    }
                    'acl-write-x_695068_bcfa_finance_exception': {
                        table: 'sys_security_acl'
                        id: 'ece4c82447a34cafb17810d3af76a1e0'
                    }
                    'acl-write-x_695068_bcfa_finance_intake': {
                        table: 'sys_security_acl'
                        id: '0a5928e3157842e5a0301cdc6192ecb8'
                    }
                    'acl-write-x_695068_bcfa_match_candidate': {
                        table: 'sys_security_acl'
                        id: '5be17f5e21434f15814cf0bc4dd02508'
                    }
                    'acl-write-x_695068_bcfa_payment_allocation': {
                        table: 'sys_security_acl'
                        id: '93ab2691b20c4ca889355070bbe88c51'
                    }
                    'acl-write-x_695068_bcfa_po_line': {
                        table: 'sys_security_acl'
                        id: 'c6e115c751ff4bf38e92bd57c04c163b'
                    }
                    'acl-write-x_695068_bcfa_purchase_order': {
                        table: 'sys_security_acl'
                        id: '0b98eded79d646d9bebf5c575ccf2a45'
                    }
                    'acl-write-x_695068_bcfa_receipt': {
                        table: 'sys_security_acl'
                        id: '5e39af44719e4f478a2a94713cdf98e3'
                    }
                    'acl-write-x_695068_bcfa_remittance': {
                        table: 'sys_security_acl'
                        id: 'b8330c8ec54843fa91afc2d3090cf5e5'
                    }
                    'acl-write-x_695068_bcfa_vendor': {
                        table: 'sys_security_acl'
                        id: '02782fbbc50e4f1ab1cee081d5f03e94'
                    }
                    'ap-aging-log': {
                        table: 'sys_hub_action_instance_v2'
                        id: '7d908a159c3f48d0890150a89f37f44b'
                    }
                    'ap-aging-lookup': {
                        table: 'sys_hub_action_instance_v2'
                        id: '6b25581331014cec938e1ed5a0805a2b'
                    }
                    'ap-approval-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: '6261fb27400a43078c246df30b532782'
                    }
                    'ap-audit-event-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: '3f50bbec89084a4c9f43f12e9db8aae0'
                    }
                    'ap-exception-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: 'cdb3bbad28614879a5f4965b084da398'
                    }
                    'ap-extraction-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: 'b4c0f998562e4824a60824ce84df651c'
                    }
                    'ap-finance-intake-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: '94a472b18dc242ef9e596d1959a72230'
                    }
                    'ap-integration-txn-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: 'b18dd3dead824aa08a5e13e3915d851a'
                    }
                    'ap-invoice-lifecycle': {
                        table: 'sttrm_model'
                        id: '3d47c892fca14824b3093e6e0cca1b5a'
                    }
                    'ap-invoice-line-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: '3e10aab4ea8949968ad56f5541fdbbb2'
                    }
                    'ap-invoice-related-list': {
                        table: 'sys_ui_related_list'
                        id: '5204fb0dd10e4066aef1705e63edf016'
                    }
                    'ap-invoice-to-audit-event-rel': {
                        table: 'sys_relationship'
                        id: '56f637cc9b114417b4bf030d96fbf173'
                    }
                    'ap-invoice-to-integration-txn-rel': {
                        table: 'sys_relationship'
                        id: '697373cbc19c4182aa7613ba5243d781'
                    }
                    'ap-match-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: 'c4dc3de2264343c39d6cc834a14e4c40'
                    }
                    'ap-state-approved': {
                        table: 'sttrm_state'
                        id: '73236bbe815049f294318c317a00cb12'
                    }
                    'ap-state-closed': {
                        table: 'sttrm_state'
                        id: 'f7d0bc4a8ef94271a39108dfa8d013c9'
                    }
                    'ap-state-exception': {
                        table: 'sttrm_state'
                        id: '4b9c85b2e93e40c183f41b78d3a93d12'
                    }
                    'ap-state-extracted': {
                        table: 'sttrm_state'
                        id: 'df5a92bcb2a4424c936e41c2343d667c'
                    }
                    'ap-state-extracting': {
                        table: 'sttrm_state'
                        id: 'ff32759e334b45019aa94cc78b9986fc'
                    }
                    'ap-state-failed': {
                        table: 'sttrm_state'
                        id: '751290f0b8a14c59ab809292f1572a42'
                    }
                    'ap-state-matched': {
                        table: 'sttrm_state'
                        id: '02f917cb0eeb4daf9a307b32b07d7cd7'
                    }
                    'ap-state-matching': {
                        table: 'sttrm_state'
                        id: '25152e3a230b408e9da9697838c0067e'
                    }
                    'ap-state-pending-approval': {
                        table: 'sttrm_state'
                        id: 'feaefe820d994660bc6df393778882b0'
                    }
                    'ap-state-posted': {
                        table: 'sttrm_state'
                        id: '4ad73f57278d4454b08933c22393c1e1'
                    }
                    'ap-state-posting': {
                        table: 'sttrm_state'
                        id: '3bbeaee0535f4985bd30534befaff84f'
                    }
                    'ap-state-received': {
                        table: 'sttrm_state'
                        id: '4ddf6751a7964b07a689f1eba73dafd1'
                    }
                    'ap-state-reconciled': {
                        table: 'sttrm_state'
                        id: 'a70d4c7380a9435e9753f015475a4001'
                    }
                    'ap-state-resolution': {
                        table: 'sttrm_state'
                        id: 'a1d74f54f9c244d7a4c5a414e8f1ac15'
                    }
                    'ap-state-unknown-outcome': {
                        table: 'sttrm_state'
                        id: 'e82021c44d564f4eb7eea7fbdbc3451e'
                    }
                    'ap-state-validated': {
                        table: 'sttrm_state'
                        id: '416b601c070d4850ad00ee7098520b37'
                    }
                    'ap-state-validating': {
                        table: 'sttrm_state'
                        id: '6c1457c70fae4cceb1196028b1a06f13'
                    }
                    'ap-trans-approved-posting': {
                        table: 'sttrm_state_transition'
                        id: 'c84af15836d44d76903c68dab54c5251'
                    }
                    'ap-trans-exception-resolution': {
                        table: 'sttrm_state_transition'
                        id: 'ad919a0f8ade40ce9b11be446ee952e2'
                    }
                    'ap-trans-extracted-validating': {
                        table: 'sttrm_state_transition'
                        id: '89ca223ba8f14092aa1bb267d4543ba1'
                    }
                    'ap-trans-extracting-extracted': {
                        table: 'sttrm_state_transition'
                        id: '27ccfba959794580924312b143082cc6'
                    }
                    'ap-trans-failed-resolution': {
                        table: 'sttrm_state_transition'
                        id: '7dd8b529345f40af829030790fe1b256'
                    }
                    'ap-trans-matched-pending-approval': {
                        table: 'sttrm_state_transition'
                        id: '2a66cb83a65f42ffa72f1a5d683e1405'
                    }
                    'ap-trans-matching-exception': {
                        table: 'sttrm_state_transition'
                        id: '865640d922dd490499fbe1a7b27e6988'
                    }
                    'ap-trans-matching-matched': {
                        table: 'sttrm_state_transition'
                        id: '7c3ed0228cdc4b9a815cd26cae84ca64'
                    }
                    'ap-trans-pending-approval-approved': {
                        table: 'sttrm_state_transition'
                        id: 'cb83fa0bc997412fa8a0b78a559b52a2'
                    }
                    'ap-trans-pending-approval-exception': {
                        table: 'sttrm_state_transition'
                        id: 'c7abca4d2ac14d18b2adfd19193d2c93'
                    }
                    'ap-trans-posted-reconciled': {
                        table: 'sttrm_state_transition'
                        id: '4c96ea434037439393e1429ab3cbeeb3'
                    }
                    'ap-trans-posting-failed': {
                        table: 'sttrm_state_transition'
                        id: '6a49d9bfa3b04c7ebb86f2766509b64e'
                    }
                    'ap-trans-posting-posted': {
                        table: 'sttrm_state_transition'
                        id: '06bc251fcb4a40a891d0c4baa5bfbb4f'
                    }
                    'ap-trans-posting-unknown-outcome': {
                        table: 'sttrm_state_transition'
                        id: 'd701eb9a8ba04d7097557e27550fa714'
                    }
                    'ap-trans-received-extracting': {
                        table: 'sttrm_state_transition'
                        id: '6ff4aa6d6b7c4263b14e7d3b459144f1'
                    }
                    'ap-trans-reconciled-closed': {
                        table: 'sttrm_state_transition'
                        id: '4905e7937a484cca9b8eb041551cecd6'
                    }
                    'ap-trans-resolution-validating': {
                        table: 'sttrm_state_transition'
                        id: 'da4eaa6806e54b0e93f5f2de2a03bee9'
                    }
                    'ap-trans-unknown-outcome-failed': {
                        table: 'sttrm_state_transition'
                        id: '41bf70267e4344c8a3060d2499064b1e'
                    }
                    'ap-trans-unknown-outcome-posted': {
                        table: 'sttrm_state_transition'
                        id: '10c8f3f0fd8140d38022a8327c7cd3c5'
                    }
                    'ap-trans-unknown-outcome-posting': {
                        table: 'sttrm_state_transition'
                        id: '63068b7d3a04414787e1d11a5ab2f8fc'
                    }
                    'ap-trans-validated-matching': {
                        table: 'sttrm_state_transition'
                        id: 'b70bcd98e023489b93c6a0dec624048d'
                    }
                    'ap-trans-validating-exception': {
                        table: 'sttrm_state_transition'
                        id: '79d8474b57244868be68f2ffe8ee4cbc'
                    }
                    'ap-trans-validating-validated': {
                        table: 'sttrm_state_transition'
                        id: '6c324b8e4ecb49b9aad569d55754e700'
                    }
                    'ar-aging-log': {
                        table: 'sys_hub_action_instance_v2'
                        id: '7fdc3b20034e4b8a8c3c909e56fdfabb'
                    }
                    'ar-aging-lookup': {
                        table: 'sys_hub_action_instance_v2'
                        id: 'c820c2b10be74ce4b872e74fb991d8a1'
                    }
                    'ar-approval-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: 'deada9cb87664befbe2a8db4b27dbbcf'
                    }
                    'ar-exception-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: 'e52b5626825644ff8447e115eb6186f7'
                    }
                    'bcfa-app-menu': {
                        table: 'sys_app_application'
                        id: 'c34b89c19957473da79f8c95aa069e60'
                    }
                    'bcfa-cat-ai': {
                        table: 'sys_ux_list_category'
                        id: '015ec263d267417d9c0ac2f5093ca969'
                    }
                    'bcfa-cat-ap': {
                        table: 'sys_ux_list_category'
                        id: '94c1902c1d9342d68648c3a231d20a9d'
                    }
                    'bcfa-cat-ar': {
                        table: 'sys_ux_list_category'
                        id: '1c32786c2e0d48549ba24b54c3be329d'
                    }
                    'bcfa-cat-intake': {
                        table: 'sys_ux_list_category'
                        id: 'dfd5b24fc72a4801b2413b443177bf74'
                    }
                    'bcfa-dashboard': {
                        table: 'par_dashboard'
                        id: '1261313489914f5f8c098758149de3cf'
                    }
                    'bcfa-dashboard-tab-overview': {
                        table: 'par_dashboard_tab'
                        id: '88122ef923db439cb162a4de868bc70d'
                    }
                    'bcfa-list-ai-interaction': {
                        table: 'sys_ux_list'
                        id: '6f856427f6d04a0f95331d4e5597d717'
                    }
                    'bcfa-list-ai-interaction-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: '4109ba6c189348d786e9c8c1c4072571'
                    }
                    'bcfa-list-ap-exception': {
                        table: 'sys_ux_list'
                        id: 'a566fe8decfc42db9cdde323d405a895'
                    }
                    'bcfa-list-ap-exception-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: '0678f95ec3db48f5a729e4d9d6036dac'
                    }
                    'bcfa-list-ap-extraction': {
                        table: 'sys_ux_list'
                        id: '2610add31b7b48f4840008fa01c6f88b'
                    }
                    'bcfa-list-ap-extraction-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: '8ad992ab062e4bac88c8ffb7bad738bf'
                    }
                    'bcfa-list-ap-invoice-all': {
                        table: 'sys_ux_list'
                        id: '538d8d5edfed4e0e99e676a6a92ec0a5'
                    }
                    'bcfa-list-ap-invoice-all-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: '95e6911b4ca24a3eaf0d6189c2176da2'
                    }
                    'bcfa-list-ap-invoice-exception': {
                        table: 'sys_ux_list'
                        id: 'e4c850e33d56444182dd38e5a6790358'
                    }
                    'bcfa-list-ap-invoice-exception-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: 'fb0919a6b06e48d1b676ff0b15ce19f8'
                    }
                    'bcfa-list-ap-invoice-pending': {
                        table: 'sys_ux_list'
                        id: '0d9251fb4a7442c48f1f11c318e1d8e5'
                    }
                    'bcfa-list-ap-invoice-pending-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: '733883b6839c4e14bd99084dc0dd03ea'
                    }
                    'bcfa-list-ar-exception': {
                        table: 'sys_ux_list'
                        id: '4de5b08e521841938f62a22ee00ef229'
                    }
                    'bcfa-list-ar-exception-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: '72a1520af0e84e33ae0d572ac990ccc0'
                    }
                    'bcfa-list-audit-event': {
                        table: 'sys_ux_list'
                        id: '656c7c5fa5fd483e9f4c999905949fc4'
                    }
                    'bcfa-list-audit-event-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: 'cc42d65cda6644188a0922816bdc39a4'
                    }
                    'bcfa-list-intake-completed': {
                        table: 'sys_ux_list'
                        id: 'ab4c005e47954011909b1017ecc89be4'
                    }
                    'bcfa-list-intake-completed-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: '1fa7c107cb884deea0df55073fa4d433'
                    }
                    'bcfa-list-intake-failed': {
                        table: 'sys_ux_list'
                        id: 'e808ba67d5b14a9283c908c9517049ee'
                    }
                    'bcfa-list-intake-failed-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: '4869ab0a06c842f1962bc96beb2553c7'
                    }
                    'bcfa-list-intake-open': {
                        table: 'sys_ux_list'
                        id: '69675b83baed4fb18d086f87afec94e6'
                    }
                    'bcfa-list-intake-open-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: 'f7b3b9a9ef9a466e9c21027529356863'
                    }
                    'bcfa-list-intake-review': {
                        table: 'sys_ux_list'
                        id: '7eabe0312f3845f18fe570634b04005a'
                    }
                    'bcfa-list-intake-review-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: '59835243e5e74a1fa30bfb08281081fc'
                    }
                    'bcfa-list-match-candidate': {
                        table: 'sys_ux_list'
                        id: '09d436163e4443108ef5998c57821065'
                    }
                    'bcfa-list-match-candidate-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: '3800ad88837343e9bb89aea50c922f6a'
                    }
                    'bcfa-list-payment-all': {
                        table: 'sys_ux_list'
                        id: '6c161d4edb934599aa4e41d2e0563a58'
                    }
                    'bcfa-list-payment-all-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: '13db1f11193047d6bbbcde856fb70f17'
                    }
                    'bcfa-list-payment-exception': {
                        table: 'sys_ux_list'
                        id: 'a563b2ba57a247d1abd64e1ef8475061'
                    }
                    'bcfa-list-payment-exception-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: '198c926b3db34f86947f201ef8a7c76c'
                    }
                    'bcfa-list-payment-pending': {
                        table: 'sys_ux_list'
                        id: '383e1ec2e8234ff1bac7f2bded380e72'
                    }
                    'bcfa-list-payment-pending-app': {
                        table: 'sys_ux_applicability_m2m_list'
                        id: 'aae3f9a0b08b49ccac66034e3e84faab'
                    }
                    'bcfa-mod-ap-approvals': {
                        table: 'sys_app_module'
                        id: '11dc22646a6b4082b1ea8692f207cfa5'
                    }
                    'bcfa-mod-ap-exceptions': {
                        table: 'sys_app_module'
                        id: 'baa419b93c6d4047a286d1a7e637b607'
                    }
                    'bcfa-mod-ap-invoices': {
                        table: 'sys_app_module'
                        id: '68e5cee2d97a47749a3e4f227cd7a85e'
                    }
                    'bcfa-mod-ar-approvals': {
                        table: 'sys_app_module'
                        id: '6961e3a3513745dbbdb6bf855d2c179a'
                    }
                    'bcfa-mod-ar-exceptions': {
                        table: 'sys_app_module'
                        id: '0ac0dc2fb4984410a87581371e092328'
                    }
                    'bcfa-mod-ar-open-items': {
                        table: 'sys_app_module'
                        id: '4fb67b970634442ab50f70fdd7c27612'
                    }
                    'bcfa-mod-ar-separator': {
                        table: 'sys_app_module'
                        id: '47a0e9b7777d4396af1dfe4a97e66656'
                    }
                    'bcfa-mod-audit-events': {
                        table: 'sys_app_module'
                        id: '08d81668c7b34cd49e989901b55e7d82'
                    }
                    'bcfa-mod-credit-notes': {
                        table: 'sys_app_module'
                        id: 'e2fcca7e32ed4dd693c612d16400c877'
                    }
                    'bcfa-mod-customers': {
                        table: 'sys_app_module'
                        id: '4a4e2cdfa9b84779b81513a6a127ee52'
                    }
                    'bcfa-mod-deductions': {
                        table: 'sys_app_module'
                        id: 'ab1b010fafdc4be48d96fb13798af350'
                    }
                    'bcfa-mod-int-separator': {
                        table: 'sys_app_module'
                        id: 'c6fc41d094d74359986a7b421cb0dd4f'
                    }
                    'bcfa-mod-integration-profiles': {
                        table: 'sys_app_module'
                        id: 'fe21eec338d44517a028581bd10e7dda'
                    }
                    'bcfa-mod-integration-txn': {
                        table: 'sys_app_module'
                        id: '930790bca28b43e1aa79ca44dddfccd9'
                    }
                    'bcfa-mod-payments': {
                        table: 'sys_app_module'
                        id: '18e4054cb8f44a58929e897a9b1eaba6'
                    }
                    'bcfa-mod-pos': {
                        table: 'sys_app_module'
                        id: 'eacb80c399984a7a8ba38d4bb7681c66'
                    }
                    'bcfa-mod-ref-separator': {
                        table: 'sys_app_module'
                        id: '212b13f0a6b143e8bd444b7ad0faf4d6'
                    }
                    'bcfa-mod-vendors': {
                        table: 'sys_app_module'
                        id: 'be5effcc5cdd4866b2646b82e2a9ba6f'
                    }
                    'bcfa-widget-ai-calls-logged': {
                        table: 'par_dashboard_widget'
                        id: '63b297d8be604f5cbbd583ad7cc80d32'
                    }
                    'bcfa-widget-ap-exceptions-by-reason': {
                        table: 'par_dashboard_widget'
                        id: 'b168e8c6ca37456885893f92d1ab866c'
                    }
                    'bcfa-widget-ar-exceptions-by-reason': {
                        table: 'par_dashboard_widget'
                        id: '6017ca619a5446cdb35ea377a3481f4a'
                    }
                    'bcfa-widget-open-ap-exceptions': {
                        table: 'par_dashboard_widget'
                        id: '6274fdd192f944559227d4770cd2b44d'
                    }
                    'bcfa-widget-open-ar-exceptions': {
                        table: 'par_dashboard_widget'
                        id: 'f58c2a33b7dd49828a798699fc7f3de7'
                    }
                    'bcfa-widget-pending-ap-approvals': {
                        table: 'par_dashboard_widget'
                        id: 'badd1634d1a74657bc1a703a9459d459'
                    }
                    'bcfa-widget-pending-ar-approvals': {
                        table: 'par_dashboard_widget'
                        id: '1534e34103e6479191589df57c7b0ecc'
                    }
                    'bcfa-workspace': {
                        table: 'sys_ux_page_registry'
                        id: 'c215f4d9f143466d887299f5ad790ee9'
                    }
                    'bcfa-workspace_sys_ux_app_config_workspace': {
                        table: 'sys_ux_app_config'
                        id: 'a31c27cbf9474e3f93e47c8ac7a7cbe1'
                    }
                    'bcfa-workspace_sys_ux_app_route_home': {
                        table: 'sys_ux_app_route'
                        id: '38cadf5d452243c98619f712f890cae6'
                    }
                    'bcfa-workspace_sys_ux_app_route_list': {
                        table: 'sys_ux_app_route'
                        id: '183b4a657b7d4c45a286095128791990'
                    }
                    'bcfa-workspace_sys_ux_app_route_record': {
                        table: 'sys_ux_app_route'
                        id: '51a580c8a2df4cdf967a3d663b042643'
                    }
                    'bcfa-workspace_sys_ux_app_route_simple-list': {
                        table: 'sys_ux_app_route'
                        id: 'bff50a8069cb4d81bdc8649a4ee72661'
                    }
                    'bcfa-workspace_sys_ux_macroponent_record': {
                        table: 'sys_ux_macroponent'
                        id: '8f8e3ec6b3304f6289f13502c5a14d17'
                    }
                    'bcfa-workspace_sys_ux_page_property_chrome_footer': {
                        table: 'sys_ux_page_property'
                        id: 'c8b67b509e2f4ff7bded567e04cc2471'
                    }
                    'bcfa-workspace_sys_ux_page_property_chrome_header': {
                        table: 'sys_ux_page_property'
                        id: '2bfd22c9c693464c8ed71f2c56e22253'
                    }
                    'bcfa-workspace_sys_ux_page_property_chrome_tab': {
                        table: 'sys_ux_page_property'
                        id: '1095c0af33a64a94b3426f6a74bc4b59'
                    }
                    'bcfa-workspace_sys_ux_page_property_chrome_toolbar': {
                        table: 'sys_ux_page_property'
                        id: '73ca8c6fcfb54a468cbdd809e0af3b53'
                    }
                    'bcfa-workspace_sys_ux_page_property_listConfigId': {
                        table: 'sys_ux_page_property'
                        id: '78a8389a22a24cef865fbc12ea39c057'
                    }
                    'bcfa-workspace_sys_ux_page_property_view': {
                        table: 'sys_ux_page_property'
                        id: 'dc844716d7e54ca39eef5f802abe4f26'
                    }
                    'bcfa-workspace_sys_ux_page_property_wbApplicabilityConfigId': {
                        table: 'sys_ux_page_property'
                        id: '7ad9e1ad1b634db796b1e57cfa99c36c'
                    }
                    'bcfa-workspace_sys_ux_registry_m2m_category_unifiedNav': {
                        table: 'sys_ux_registry_m2m_category'
                        id: '48551aa2891e4db9b5938141f8fd54ba'
                    }
                    'bcfa-workspace_sys_ux_screen_home': {
                        table: 'sys_ux_screen'
                        id: '61ff30c2071f43a0825c83a602b8ba46'
                    }
                    'bcfa-workspace_sys_ux_screen_list': {
                        table: 'sys_ux_screen'
                        id: 'bdbfdae334a94068ac012aa8a3a2402f'
                    }
                    'bcfa-workspace_sys_ux_screen_record': {
                        table: 'sys_ux_screen'
                        id: '2d483127cc154153ba880742beb0f450'
                    }
                    'bcfa-workspace_sys_ux_screen_simple-list': {
                        table: 'sys_ux_screen'
                        id: '9ee54df442824b459fdd95194d6d3517'
                    }
                    'bcfa-workspace_sys_ux_screen_type_home': {
                        table: 'sys_ux_screen_type'
                        id: '0bd8df2b383e4646a47ca84f2cb7f534'
                    }
                    'bcfa-workspace_sys_ux_screen_type_list': {
                        table: 'sys_ux_screen_type'
                        id: 'd6751b11bfad4f399b5bf72653455998'
                    }
                    'bcfa-workspace_sys_ux_screen_type_record': {
                        table: 'sys_ux_screen_type'
                        id: 'f1c281c90f59443fb53a26b36fde3add'
                    }
                    'bcfa-workspace_sys_ux_screen_type_simple-list': {
                        table: 'sys_ux_screen_type'
                        id: 'a352a2e1cfb64fe0821382d4dd715236'
                    }
                    'bcfa-workspace-applicability': {
                        table: 'sys_ux_applicability'
                        id: 'b863de507c2b4ed88b1bedc706429a95'
                    }
                    'bcfa-workspace-list-config': {
                        table: 'sys_ux_list_menu_config'
                        id: 'fb16c25153c543d2a3b3d6085a42ac55'
                    }
                    'bcfa-workspace-route-acl': {
                        table: 'sys_security_acl'
                        id: 'c8f598159ed2462ebb324cc529b2874f'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: 'bec030c6665d49539f255c3748ff88d8'
                    }
                    'br-ap-invoice-approval-cascade': {
                        table: 'sys_script'
                        id: '6986d6fb2d40494cb71bc8787aac8ad4'
                    }
                    'br-ar-payment-approval-cascade': {
                        table: 'sys_script'
                        id: 'e39de90e641547018027fa21d9745b30'
                    }
                    'br-finance-intake-auto-number': {
                        table: 'sys_script'
                        id: '02e3ad1ac8084ff3b5fc039b9b900023'
                    }
                    'ca-state-allocation': {
                        table: 'sttrm_state'
                        id: '530e59fcb8724b768d6a8852ff8e4c4e'
                    }
                    'ca-state-approved': {
                        table: 'sttrm_state'
                        id: '54d32fad1ca242549507b686a6e0d706'
                    }
                    'ca-state-cleared': {
                        table: 'sttrm_state'
                        id: 'd77ceb7ebb524d56806c66f683b0855b'
                    }
                    'ca-state-clearing': {
                        table: 'sttrm_state'
                        id: 'd6b9b748020749f6b8ce485da3e38969'
                    }
                    'ca-state-closed': {
                        table: 'sttrm_state'
                        id: 'f825699094b045fa88916f96ffc8cfd9'
                    }
                    'ca-state-customer-resolution': {
                        table: 'sttrm_state'
                        id: '9396141c4d7f416c8df9a3e72ddd4623'
                    }
                    'ca-state-exception': {
                        table: 'sttrm_state'
                        id: '832eddb7ce1d4145b6da48c7f1db35e4'
                    }
                    'ca-state-failed': {
                        table: 'sttrm_state'
                        id: 'cdb78cc015084ba989f488018f95fd7f'
                    }
                    'ca-state-matched': {
                        table: 'sttrm_state'
                        id: 'b8e29f8d28c74f8581493018b83bd67b'
                    }
                    'ca-state-matching': {
                        table: 'sttrm_state'
                        id: 'a4a171303ad843ab8047d777dc0a5c9c'
                    }
                    'ca-state-normalized': {
                        table: 'sttrm_state'
                        id: 'd5bdae0d6ec34bf9b9e7164a0556b75a'
                    }
                    'ca-state-partially-matched': {
                        table: 'sttrm_state'
                        id: '514445a73fde41aaa44d8d64d7b31a36'
                    }
                    'ca-state-pending-approval': {
                        table: 'sttrm_state'
                        id: '42ecdfb495d648d6a29b53ac4a63d475'
                    }
                    'ca-state-received': {
                        table: 'sttrm_state'
                        id: '303095c1538148449b306dc5e2a7f77e'
                    }
                    'ca-state-reconciled': {
                        table: 'sttrm_state'
                        id: '7b57c95ffe204eb1a65d72f103764b77'
                    }
                    'ca-state-unknown-outcome': {
                        table: 'sttrm_state'
                        id: '562b028d09e44c6e98e431b0b8b1a6b3'
                    }
                    'ca-state-unmatched': {
                        table: 'sttrm_state'
                        id: 'f0934adff8bb460f8e1db61f71a7f3ba'
                    }
                    'ca-trans-allocation-exception': {
                        table: 'sttrm_state_transition'
                        id: '29d29c24ee744720a829aee3bc04dcc8'
                    }
                    'ca-trans-allocation-pending-approval': {
                        table: 'sttrm_state_transition'
                        id: '13e2d2fd8c6a46f2a0cb1c45a8c235e3'
                    }
                    'ca-trans-approved-clearing': {
                        table: 'sttrm_state_transition'
                        id: '6d37c5fbe1724afdb9fc6ba21040a734'
                    }
                    'ca-trans-cleared-reconciled': {
                        table: 'sttrm_state_transition'
                        id: '1ba4cedd2b504ce3a56e01e7b2ec6b62'
                    }
                    'ca-trans-clearing-cleared': {
                        table: 'sttrm_state_transition'
                        id: 'da09d1e0bdce4fa7a8cbc54a9c900d5a'
                    }
                    'ca-trans-clearing-failed': {
                        table: 'sttrm_state_transition'
                        id: 'eb8ea1e87bb740309b790e8a8ce589e8'
                    }
                    'ca-trans-clearing-unknown-outcome': {
                        table: 'sttrm_state_transition'
                        id: 'd33062e646034c5ba4b4df70113b7be6'
                    }
                    'ca-trans-customer-resolution-exception': {
                        table: 'sttrm_state_transition'
                        id: 'dc559c347f4a4bb99273e19afa194ef4'
                    }
                    'ca-trans-customer-resolution-matching': {
                        table: 'sttrm_state_transition'
                        id: '724184765909430ca0ea70d03c99dc8a'
                    }
                    'ca-trans-exception-matching': {
                        table: 'sttrm_state_transition'
                        id: '0bbf1bd1312e4d6090fbc78923c79efb'
                    }
                    'ca-trans-failed-exception': {
                        table: 'sttrm_state_transition'
                        id: '69713b6ab071411ea5e9b0bb0c8781cc'
                    }
                    'ca-trans-matched-allocation': {
                        table: 'sttrm_state_transition'
                        id: '3b46177a12164951b778d7928ed27785'
                    }
                    'ca-trans-matching-matched': {
                        table: 'sttrm_state_transition'
                        id: 'c4c9b5653f28439fbf4d5c8cdc5470ad'
                    }
                    'ca-trans-matching-partially-matched': {
                        table: 'sttrm_state_transition'
                        id: '1ebc21b024b54c99bbe6bfbb11235a6f'
                    }
                    'ca-trans-matching-unmatched': {
                        table: 'sttrm_state_transition'
                        id: '2dae3525002347d5888d55ac5e4428eb'
                    }
                    'ca-trans-normalized-customer-resolution': {
                        table: 'sttrm_state_transition'
                        id: '827a8478becf44349b8c8869aa89da3c'
                    }
                    'ca-trans-partially-matched-allocation': {
                        table: 'sttrm_state_transition'
                        id: '6c04cb2c3aad41a6983336cdf2d79615'
                    }
                    'ca-trans-pending-approval-approved': {
                        table: 'sttrm_state_transition'
                        id: '197680a8175941538dd9b75155265eb5'
                    }
                    'ca-trans-pending-approval-exception': {
                        table: 'sttrm_state_transition'
                        id: '1ae7711323e54f2f95cfaf78766f1f96'
                    }
                    'ca-trans-received-normalized': {
                        table: 'sttrm_state_transition'
                        id: '3ccb86f190cd41ad9feebf9fce799a64'
                    }
                    'ca-trans-reconciled-closed': {
                        table: 'sttrm_state_transition'
                        id: 'ca5fc865980f485b89400ed1ee20d3b5'
                    }
                    'ca-trans-unknown-outcome-cleared': {
                        table: 'sttrm_state_transition'
                        id: '52ae4426a2a7470887faee0b9439198e'
                    }
                    'ca-trans-unknown-outcome-clearing': {
                        table: 'sttrm_state_transition'
                        id: '4f487e6e7cc844e682b9cb561bdbe354'
                    }
                    'ca-trans-unknown-outcome-failed': {
                        table: 'sttrm_state_transition'
                        id: '1846fc53a0a64411bfd3a7677bd6868e'
                    }
                    'ca-trans-unmatched-exception': {
                        table: 'sttrm_state_transition'
                        id: '7215712b27dd49d697807faed9841051'
                    }
                    'cash-app-lifecycle': {
                        table: 'sttrm_model'
                        id: 'abff1713d7c94462ba74a68f0a935603'
                    }
                    'cross-scope-glide-sys-attachment': {
                        table: 'sys_scope_privilege'
                        id: '253d4e54c86949d99dfb6a51a84201fc'
                    }
                    'deduction-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: '0820a072c9534711bdf07df3f0517802'
                    }
                    'flow-ap-exception-aging-escalation': {
                        table: 'sys_hub_flow'
                        id: '8769e860868b4d1da62856fa0f7e0f76'
                    }
                    'flow-ar-exception-aging-escalation': {
                        table: 'sys_hub_flow'
                        id: 'ba50cc23ef894ee7a317396f3de70b0c'
                    }
                    'job-claude-ap-phase2-test-v1': {
                        table: 'sysauto_script'
                        id: '3ee2dd70a2604290b1f0b1e56a2cb8e8'
                        deleted: true
                    }
                    'job-claude-ar-phase3-test-v1': {
                        table: 'sysauto_script'
                        id: 'c8cdc100e0be416f9e3803af2ff378c3'
                        deleted: true
                    }
                    'job-claude-connectivity-test-v1': {
                        table: 'sysauto_script'
                        id: 'e7e65a52158a4f729e4d512d736f65cd'
                    }
                    'job-claude-credential-diagnostic-v1': {
                        table: 'sysauto_script'
                        id: 'b7df05c7914845c1b0a758b172e98031'
                        deleted: true
                    }
                    'job-claude-demo-cash-bc0002-fix-v1': {
                        table: 'sysauto_script'
                        id: 'd13d01eec52145ec96bb1273c7bbff5f'
                        deleted: true
                    }
                    'job-claude-demo-seed-v1': {
                        table: 'sysauto_script'
                        id: '3ea0bc119c5b439682351ff485c661b8'
                    }
                    'job-claude-phase5-hardening-test-v1': {
                        table: 'sysauto_script'
                        id: 'd4f2641daaa34cecb6e01ba617da0fbf'
                        deleted: true
                    }
                    'job-correctness-verification': {
                        table: 'sysauto_script'
                        id: 'e258dba83ce643cf9bef4ad449b367d4'
                    }
                    'job-correctness-verification-v2': {
                        table: 'sysauto_script'
                        id: 'd9c533e9bfb94bc7997daf14e83d743f'
                    }
                    'job-correctness-verification-v3': {
                        table: 'sysauto_script'
                        id: 'f13badd1bc8e409990aa4b35f7057ff6'
                    }
                    'job-correctness-verification-v4': {
                        table: 'sysauto_script'
                        id: '6f1e353b05644fbcbd30a26bb6b567f9'
                    }
                    'job-demo-data-reseed-v2': {
                        table: 'sysauto_script'
                        id: '1ecebae4551c40488a85fb8784d3c391'
                    }
                    'job-demo-data-reseed-v3': {
                        table: 'sysauto_script'
                        id: '4980f67c070041c097dc806ca5d815c5'
                    }
                    'job-demo-data-reseed-v4': {
                        table: 'sysauto_script'
                        id: '945ad8554f084795b4d73a52cc4720f5'
                    }
                    'job-demo-data-reseed-v5': {
                        table: 'sysauto_script'
                        id: '777f93deb64c48509e6a685965571577'
                    }
                    'job-demo-data-reseed-v6': {
                        table: 'sysauto_script'
                        id: 'da7a3ae6646f4ee78d41267e9955c50c'
                    }
                    'job-demo-data-seed': {
                        table: 'sysauto_script'
                        id: 'd5412ae7a053484f8c333b2c34f96404'
                    }
                    'job-diagnostic-vendor-bug': {
                        table: 'sysauto_script'
                        id: '06226f4a65c74f899aa237342ed1a170'
                        deleted: true
                    }
                    'match-candidate-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: 'b6d4108f47a94bbaadf4a45eb5b08487'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'e95435ae294b4c5bac7cbdf71afaf7ef'
                    }
                    'payment-allocation-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: 'bf429c1395a048c6a45a2c150619b276'
                    }
                    'payment-allocation-related-list': {
                        table: 'sys_ui_related_list'
                        id: 'f46e1afbf3ae4f3ba08564b3be45a2d8'
                    }
                    'payment-audit-event-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: '60c1c4b8ed9c4936be55df720432112d'
                    }
                    'payment-finance-intake-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: '4fc5f2cc6a244959ae97f017fc658c86'
                    }
                    'payment-integration-txn-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: '9e419aa473ba4dfdacc681e2342ef320'
                    }
                    'payment-related-list': {
                        table: 'sys_ui_related_list'
                        id: '6427ece927454448ba28afb659ba11f5'
                    }
                    'payment-to-audit-event-rel': {
                        table: 'sys_relationship'
                        id: '6d2eed938dbb42818c6d3c693889809a'
                    }
                    'payment-to-integration-txn-rel': {
                        table: 'sys_relationship'
                        id: '441636eb19f04a8cb37ee5da09cbadc8'
                    }
                    'prop-claude-allowed-attachment-types': {
                        table: 'sys_properties'
                        id: '0c3449e02fbb483986cd89720c2c89f7'
                    }
                    'prop-claude-confidence-threshold': {
                        table: 'sys_properties'
                        id: '19d3680cb7374fd7a900a3686ce4a353'
                    }
                    'prop-claude-enabled': {
                        table: 'sys_properties'
                        id: 'a967c0acc6a84c9783c0349931fca287'
                    }
                    'prop-claude-max-attachment-size': {
                        table: 'sys_properties'
                        id: 'c44f2ecec805459caba6836a50ef1252'
                    }
                    'prop-claude-max-tokens': {
                        table: 'sys_properties'
                        id: '14de0ec35d204c53a2371a5f2d872355'
                    }
                    'prop-claude-model': {
                        table: 'sys_properties'
                        id: 'd085cc4939df4bcca67aa60e3bd99af8'
                    }
                    'prop-claude-timeout': {
                        table: 'sys_properties'
                        id: '732add1fdb044f53b34565facd13fd3a'
                    }
                    'remittance-entry': {
                        table: 'sys_ui_related_list_entry'
                        id: '68b282b5fb7d4dfe807e94d135d24695'
                    }
                    'si-ai-simulation-service': {
                        table: 'sys_script_include'
                        id: '0372afb15bd34198a55694c0a0a607ce'
                    }
                    'si-ap-domain-service': {
                        table: 'sys_script_include'
                        id: '5d8f9a6cb8f340a49220bf64557ab807'
                    }
                    'si-ap-line-resolution-service': {
                        table: 'sys_script_include'
                        id: 'cab50fc2d6d54247ac5692c57dea24ca'
                    }
                    'si-approval-engine': {
                        table: 'sys_script_include'
                        id: 'c08e2462cb5d47729ce0d53d8ef19e7d'
                    }
                    'si-ar-domain-service': {
                        table: 'sys_script_include'
                        id: '9ff76bff0be04fc482acca2070d12f6b'
                    }
                    'si-audit-engine': {
                        table: 'sys_script_include'
                        id: '7e823507dda24394a78362a73fe7f2e9'
                    }
                    'si-bc-claude-client': {
                        table: 'sys_script_include'
                        id: 'b8b296d6009944209283a8e91a573ae6'
                    }
                    'si-demo-data-seeder': {
                        table: 'sys_script_include'
                        id: '5557c39b046b40dbb32c511181f09e80'
                    }
                    'si-exception-engine': {
                        table: 'sys_script_include'
                        id: '7bbff4295d974545a9726e9e6dc65ed2'
                    }
                    'si-finance-document-intake-service': {
                        table: 'sys_script_include'
                        id: '1c7b870db61a4e3388acbf09d0575157'
                    }
                    'si-integration-service': {
                        table: 'sys_script_include'
                        id: '39b716147f8144818f9cbbb75f92dd3b'
                    }
                    'si-matching-engine': {
                        table: 'sys_script_include'
                        id: '1c5d6ab209d349538f1cc7c9f33aca6e'
                    }
                    'si-mock-archive-adapter': {
                        table: 'sys_script_include'
                        id: '01297ad69cb043d38715dce94e0c0a13'
                    }
                    'si-mock-bank-adapter': {
                        table: 'sys_script_include'
                        id: 'ff42209b536046a8ac48e93252493ab9'
                    }
                    'si-mock-sap-adapter': {
                        table: 'sys_script_include'
                        id: '8cf56e81999b42d5b95b6163c0e6e265'
                    }
                    'src_server_business-rules_ApInvoiceApprovalCascade_server_js': {
                        table: 'sys_module'
                        id: 'adb8dfe4dfc04821ab96adc36e08c19d'
                    }
                    'src_server_business-rules_ArPaymentApprovalCascade_server_js': {
                        table: 'sys_module'
                        id: '1b355af8c6894d7e953beb08898f8d20'
                    }
                    'src_server_business-rules_FinanceIntakeAutoNumber_server_js': {
                        table: 'sys_module'
                        id: '658b4329ad42400abd7c9c21b50885f1'
                    }
                    'src_server_script-includes_AISimulationService_server_js': {
                        table: 'sys_module'
                        id: 'e80ff3181f2e4269a1ecfce5278a2813'
                    }
                    'src_server_script-includes_ApDomainService_server_js': {
                        table: 'sys_module'
                        id: 'e86ed0d384544abd95097dde0847f525'
                    }
                    'src_server_script-includes_ApLineResolutionService_server_js': {
                        table: 'sys_module'
                        id: '3bcbaa83464b43a9bb678da067db3b37'
                    }
                    'src_server_script-includes_ApprovalEngine_server_js': {
                        table: 'sys_module'
                        id: 'ce72a3660eb94cc0bf18e4083d7ac09a'
                    }
                    'src_server_script-includes_ArDomainService_server_js': {
                        table: 'sys_module'
                        id: '900096eabe814cecb23b5d452bbcf98f'
                    }
                    'src_server_script-includes_AuditEngine_server_js': {
                        table: 'sys_module'
                        id: '8ca530fff6c74d0c8ee382a6eefdab4a'
                    }
                    'src_server_script-includes_BCClaudeClient_server_js': {
                        table: 'sys_module'
                        id: 'e137a0eb5f8e419d888a2aa239178dba'
                    }
                    'src_server_script-includes_DemoDataSeeder_server_js': {
                        table: 'sys_module'
                        id: '27d2fb84df4d47d487c59705a63fe43b'
                    }
                    'src_server_script-includes_ExceptionEngine_server_js': {
                        table: 'sys_module'
                        id: '002a997e82d441c8a4a8c3efe8da4b6c'
                    }
                    'src_server_script-includes_FinanceDocumentIntakeService_server_js': {
                        table: 'sys_module'
                        id: 'a021a8f270c349a2aad0ca03485a8bc4'
                    }
                    'src_server_script-includes_IntegrationService_server_js': {
                        table: 'sys_module'
                        id: 'dc4236420eb2471383942a5d23b98303'
                    }
                    'src_server_script-includes_MatchingEngine_server_js': {
                        table: 'sys_module'
                        id: '0afe83b033c04df8b7bacd7ed3786d63'
                    }
                    'src_server_script-includes_MockArchiveAdapter_server_js': {
                        table: 'sys_module'
                        id: '6564ce495a364a77a1c91b0d33a30a1e'
                    }
                    'src_server_script-includes_MockBankAdapter_server_js': {
                        table: 'sys_module'
                        id: 'd7f35577f18d40f395a19330a33c5d90'
                    }
                    'src_server_script-includes_MockSAPAdapter_server_js': {
                        table: 'sys_module'
                        id: '00c8fcb17124498f8f07569c9bcce76d'
                    }
                    'test-idempotency': {
                        table: 'sys_atf_test'
                        id: 'f29aeb57a3e645b3ae033265f5ff8552'
                    }
                    'test-idempotency-step': {
                        table: 'sys_atf_step'
                        id: '0ed0fbb411da48efa9fa4608fc130842'
                    }
                    'test-seed-demo-data': {
                        table: 'sys_atf_test'
                        id: '380af6ab0446412ba68a11b58aca8f1d'
                    }
                    'test-seed-demo-data-step': {
                        table: 'sys_atf_step'
                        id: '1e2cb716f551452199c8c3215c981014'
                    }
                    'test-sod-self-approval': {
                        table: 'sys_atf_test'
                        id: '558406a41125475db1ef504e8a4330a6'
                    }
                    'test-sod-self-approval-step': {
                        table: 'sys_atf_step'
                        id: '52e31c5ce1dd441eaea3e7dadd678f70'
                    }
                    'test-unknown-outcome-control': {
                        table: 'sys_atf_test'
                        id: '93bd7d7310f9483bb79b0c4217362234'
                    }
                    'test-unknown-outcome-control-step': {
                        table: 'sys_atf_step'
                        id: '10f7c4ad3d8c46889841a6386cbf4330'
                    }
                    'trg-ap-exception-aging': {
                        table: 'sys_hub_trigger_instance_v2'
                        id: '0cca1ec2e8594aa5b64adb9fcf33583a'
                    }
                    'trg-ar-exception-aging': {
                        table: 'sys_hub_trigger_instance_v2'
                        id: '0038ab76fdf64d93aed873fed77f324c'
                    }
                    'ui-action-ap-approval-approve': {
                        table: 'sys_ui_action'
                        id: '18b2ffb432d943449a162c7a1acfe9b3'
                    }
                    'ui-action-ap-approval-approve-layout-item': {
                        table: 'sys_ux_form_action_layout_item'
                        id: 'e6ad71a4819a42328db9b2824e00209e'
                    }
                    'ui-action-ap-exception-explain-claude': {
                        table: 'sys_ui_action'
                        id: '83a2a055103042c8962ed9a56f25bef5'
                    }
                    'ui-action-ap-exception-explain-claude-layout-item': {
                        table: 'sys_ux_form_action_layout_item'
                        id: 'ef917fbe842f4aed99b76e2485f7e907'
                    }
                    'ui-action-ap-exception-resolve-and-retry': {
                        table: 'sys_ui_action'
                        id: '0c62832a713c4dbf8f81283176b921a6'
                    }
                    'ui-action-ap-exception-resolve-and-retry-layout-item': {
                        table: 'sys_ux_form_action_layout_item'
                        id: '625e911e88674e1ab5f57519fd9d9199'
                    }
                    'ui-action-ap-invoice-rerun-match': {
                        table: 'sys_ui_action'
                        id: 'aa49bcfe92ea415bab51ed26ca7b3d9f'
                    }
                    'ui-action-ap-invoice-rerun-match-layout-item': {
                        table: 'sys_ux_form_action_layout_item'
                        id: '343fb1661f5745a9a0bcd894dd37ff66'
                    }
                    'ui-action-ap-invoice-rerun-validation': {
                        table: 'sys_ui_action'
                        id: '2281a5684eea4af5b8e9850af7186ac9'
                    }
                    'ui-action-ap-invoice-rerun-validation-layout-item': {
                        table: 'sys_ux_form_action_layout_item'
                        id: '17258f14d10740cf8951e6d25ad14e65'
                    }
                    'ui-action-ar-approval-approve': {
                        table: 'sys_ui_action'
                        id: '58b6ffce33d24163b78b0a686390496f'
                    }
                    'ui-action-ar-approval-approve-layout-item': {
                        table: 'sys_ux_form_action_layout_item'
                        id: '67db212e411441c89db4bf8e5da3b7ed'
                    }
                    'ui-action-ar-exception-explain-claude': {
                        table: 'sys_ui_action'
                        id: 'bc2017ca30674afebde162cd93a9aaa6'
                    }
                    'ui-action-ar-exception-explain-claude-layout-item': {
                        table: 'sys_ux_form_action_layout_item'
                        id: '0c77e7ea276e4a8a89bb98bb7bc0942f'
                    }
                    'ui-action-intake-process-with-claude': {
                        table: 'sys_ui_action'
                        id: '18d525d32dce47ce959ada18613b9a06'
                    }
                    'ui-action-intake-process-with-claude-layout-item': {
                        table: 'sys_ux_form_action_layout_item'
                        id: 'd2227374fe1441ffa703b4072de93436'
                    }
                    'ui-action-intake-reprocess': {
                        table: 'sys_ui_action'
                        id: 'd6364c9589c84fea88ccac365a8fdbcc'
                    }
                    'ui-action-intake-reprocess-layout-item': {
                        table: 'sys_ux_form_action_layout_item'
                        id: '46aec615de774c9694bbdaaceb1ff426'
                    }
                    'ui-action-intake-send-to-manual-review': {
                        table: 'sys_ui_action'
                        id: 'f13745dac6a540a28a8ce31af80d2ad9'
                    }
                    'ui-action-intake-send-to-manual-review-layout-item': {
                        table: 'sys_ux_form_action_layout_item'
                        id: 'ec0e77dc131b43c78a3a249a1036de78'
                    }
                }
                composite: [
                    {
                        table: 'sys_choice_set'
                        id: '000f7fa864df49708bd8809c5e36e6a1'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'failure_mode'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0010b0a7de4b4148bd733b53e8a848b0'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '00329952490641ec902daa5ddab92068'
                        key: {
                            sys_security_acl: '32ba172e87a347538c62c40d953598ea'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '003a7afb113e4432880a3e77ac198b6c'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'amount'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '00ed1d2566e1408fbe2fe1e48c678cf0'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'occurred_at'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '00f181affccf4cd7991667790aa5a86e'
                        key: {
                            sys_security_acl: 'c39b37d54b874cd5bfe8e3f3ee6d5bba'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '01ec87957ced4a26983c1d737d5aeb70'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'unit_price'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '0247a20e7a6c4c8f94859bcf5c8c5309'
                        key: {
                            sys_security_acl: '6e927aab17524583ac6e3549985e6968'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '027ec274fd754dff8350faf02affcf7f'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'actor_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '032ee2403709423a882b14695a91a107'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'event_type'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0337ddb0490045d0bca566a1efe9787d'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '035aebb6fb094958b68bfd46ad8e2278'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'source_record'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '03604bf4100246588f4250676240bc18'
                        key: {
                            name: 'x_695068_bcfa.auditor'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '036cb1bebc8c4af39dc4debfafa151c0'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'company_code'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '03b8eb00bb6d4ee3ba2235c0878f507b'
                        key: {
                            sys_security_acl: '9772832986ee4b3db736de1a9a377737'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '03ddd4da3e9046c590acd61a80126a97'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'deduction_type'
                            value: 'unapplied'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '03ed83ded0184b298ba4c5c58a988528'
                        key: {
                            sys_security_acl: '0dc596ee317640a8a854239ece6e4581'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0410a1e986324edfab176b943c65236e'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '04309561705f42d9b35ec81535c19dc2'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '045a5aaf9c1a42919643828587868f09'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'severity'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '04b37cb999db41ba96167bb9579888ce'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'source'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '04d8b76719614586a20a1f6f34089269'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '04ea6144260b40ae901e39c0a3c1cdfa'
                        key: {
                            sys_security_acl: 'd7fef0b814bf4ef9ac5cd0b78a84a3d7'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0512949ed0d54d6db4c8ea5d47f1bb67'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'currency'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0537a04be12d460da9321b5a0680029d'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'output_tokens'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '05394d9c237d477dac372db92886cb30'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'processing_status'
                            value: 'processing'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0558fea88cd24139b8d8c4bede98cbde'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'company_code'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '05a350cf06044a389e6b3268f10a066f'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'initiated_by'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '05acfdc6067e46768f1eaebec0e4fe76'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'match_type'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '05beb123fc2a4ca6889742af14deec19'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'match_result'
                            value: 'mismatch'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '05c01aaf342948f0b04d01fbb99521a8'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'decision'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '05d90bea6e694032b89cb165a26f820f'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0615a38996c3497ba2c6d416eb23dc87'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'residual_amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '06254937a2c14351b2575f7ed2238ddf'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'processing_status'
                            value: 'classifying'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0662d795919b4b5c82369a4f6cad647f'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'payment'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '06903de00bd3468ea3c582cf311ba3df'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'allocation_state'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '06c562cdbe4b4f8bbbe4aa7b48ad4626'
                        key: {
                            sys_security_acl: 'e94b991c4b954494b225f3a86a9a7eb8'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '06d50f525f934163acca8b6bb395c348'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'residual_amount'
                        }
                    },
                    {
                        table: 'sys_number'
                        id: '06f296e0d013467fa76e8f487eaf62de'
                        key: {
                            category: 'x_695068_bcfa_finance_intake'
                            prefix: 'FDI'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '06f3957b730f4c2fa45d2e40fa657d3e'
                        key: {
                            sys_security_acl: 'e94b991c4b954494b225f3a86a9a7eb8'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '06fa462a1e46443b8a5ed3530966b927'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'source_reference'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '074b32c8fc2741658d969d65df70726c'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'unknown_outcome_flag'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '075d7432b8ef4d5fbc7e48be8431db2b'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'adapter'
                            value: 'mock_sap'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0761c364ad494a149586cee9c154781e'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'claude_request_id'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '078f3db97e16470692e1db977f4605ad'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'idempotency_key'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '07957a7bc0a747e18b2767f99683a1e7'
                        key: {
                            sys_security_acl: 'b8330c8ec54843fa91afc2d3090cf5e5'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '082a696a280441739da649ac624808fd'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '08f692f6f1da4080ac4909f9aa4d7399'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'ap_invoice'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '09127131f7184d058971cb0ec3eb1459'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'ap_invoice'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '092a05498e1a4de9a2726242eb817a56'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'decision'
                            value: 'approved'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '09302d71a3cc488f8d78b775573bbc04'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0936204a5e4949abad4c68fbb52a6260'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'internal_value'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '095ca47be71947deb26b8dc21afc91ce'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'status'
                            value: 'open'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '098e68749703418db6b2649e0f1b2147'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '09c532c275e54541b29cfffb1fddb77c'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'material_or_service'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0a903cacea3446d68bfd9060d18514e2'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'resolution_notes'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '0a97cb3d10344552a651b044995b0929'
                        key: {
                            sys_security_acl: '809a8beda06447cab66c275294eea951'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0ad6ff2a69c145048f0dd429e9447ff0'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'error_message'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0b056a5581754d39a1094568650e3aea'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'quantity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '0b3eca5ae228483c8e60f9a488e32314'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0b407a810273425888862f60a3bba75e'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'allocation_state'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0b726a44b043464194626cbeeae07417'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0b86123d75354e4d988d8e45bf7061b9'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'correlation_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0b8abf4e3878487684adb3b3189605aa'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0b91895246b34062b36e2af3e6c25e02'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'remittance'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0bd1794f4c9042759426ad0ab53d9dae'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'adapter'
                            value: 'mock_bank'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0be83a0485b541ebaf70fcadfba5bdf3'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0c4150afb65c4612ad2be759bb963368'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'internal_reference_record'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '0c4ec58b4b8d4effa699694222685cfd'
                        key: {
                            name: 'x_695068_bcfa.integration_operator'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0c8821f8013848e4a4eec87ff3a4ddf9'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0c97a9958d354816a9e7c8ea127d4dbd'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0cc9f0a4b9b34e21a248bec51d45e421'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'ai_recommendation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0d0871d0aa684a409d013a75ab5a4ac9'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'extraction_confidence'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0d37fe24eb5547eabb36076d32f5eec4'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'failure_mode'
                            value: 'technical_error'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0d705fe3d8c04ab5ba0b05762cfcf21d'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'unknown_outcome_flag'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '0d9a8bf0da0f4285bbc47db913ef850e'
                        key: {
                            sys_security_acl: 'ece4c82447a34cafb17810d3af76a1e0'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '0e01860485934cc6a5c8ce68678f0a04'
                        key: {
                            sys_security_acl: '87c6a912c317412e9cc92697f62124c3'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0e11ef5e7c0b43da9279fb92615bcd13'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'source'
                            value: 'now_assist_document_intelligence'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '0e7ad36b2faf48bf80483956d4de33cd'
                        key: {
                            sys_security_acl: '3a5bc2a915f246a1a5082dea10a03ea5'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0e9445046a0041f4aafcb5d4fb206b5a'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0ea7bc6e37a54e6988c11545c06ef2c5'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'description'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0f184efc38f14a919f265bbe36be7ca3'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'po_line'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0f725a11f89a43aeae412a0464f7212b'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'requested_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1028a77cec084fa3b981097af8969dce'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'correlation_id'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1028ad7aed2844368f47dfead9f57df6'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'issue_date'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '10388d4956684aba8615bd25194f70ad'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'reason_code'
                            value: 'other'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1093c8d550494d1d9fe12b5861ff2c63'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'failure_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '10b878222f2344ce8d45400314f72ab1'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '10bfecc52a9a45e284d3316adebb94ed'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'allocation_state'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '10c5b644391a4a4e975399041b259498'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '10cb164e037e4a8bba1aff433d986e31'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                            value: 'extract_ar_remittance_document'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '10da43faf30349ddb785ec2905751a01'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'adapter'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1114123813d4493b88fac617d1046937'
                        key: {
                            sys_security_acl: '7cff9e3ec5c84580af58603082596ac2'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '112d88ea90fc4f40bd04559c5b3e455c'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'invoice_amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '113a28cfdb2842ad943e96bb473a95a6'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'receipt_reference'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '11a2ff3379d1490b95d62be917b24d9b'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'bank_charge'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1267806b758342978aad52c7e5a004a5'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'reviewed_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '12b52e45aa78428fbdd4971901e330bb'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1354b51c7eaf4e0eb003774ebafebfaa'
                        key: {
                            sys_security_acl: 'd641e8a7ecde48d6b7aae9d17768dfd9'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1355d9be27444dedb80ac1eb43bce88e'
                        key: {
                            sys_security_acl: '0d26f90a165942f8b16b46948adb7d88'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1373298093134d0bb202be096f23bb04'
                        key: {
                            sys_security_acl: '3bb5f2cb93cb48dfa4cf9a37e20f9946'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_element_mapping'
                        id: '13f41c6801ef4274bfa6bcaf8523ba6d'
                        key: {
                            id: '52e31c5ce1dd441eaea3e7dadd678f70'
                            table: 'var__m_atf_input_variable_41de4a935332120028bc29cac2dc349a'
                            field: 'script'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '13fdac2a656c4ac388d7a1346ede4028'
                        key: {
                            sys_security_acl: '5e39af44719e4f478a2a94713cdf98e3'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '14016503e28842a59f3e13d1eacf1ed9'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'currency'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '143c581d00fd406a94524b2cb4733e53'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '1461fcd915b644fe8db7d359ce94dad4'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '14632fe41b434909a9701069b32c2d60'
                        key: {
                            sys_security_acl: '48658a85a5bd428b916c59a1e8fe5999'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '146fada775d04ae0a40367dcc7608a9a'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'payment_terms'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1483744f21bb4031bb8438d39048e17b'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'safe_error'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '15a025c2a692453fb84ef574892297ee'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '15b47b88c60d4851bd406dc1bbff60f5'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'status'
                            value: 'timeout'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '1660c8cc347d445ba6b19dc3fe8f9f0f'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '16a1839f56a944a3b8b34fc05c3b101e'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'source_table'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '16bd2c62d8464447adf58a0b44786950'
                        key: {
                            sys_security_acl: '87c6a912c317412e9cc92697f62124c3'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '176d55fa8aae455f893d8f543bb83391'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'credit_note_number'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '17ee2fe94bd640b69eabfeee106d00de'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                            value: 'explain_ap_exception'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1809e70bf21848abba40a8b98ef175c3'
                        key: {
                            sys_security_acl: '12f4ad253d554352ab0a05e0576730fa'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '182af6cd46294ff483984e06f0054683'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'reason_code'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '18888750bbb6491aa82c5464d262935c'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'po_line'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '188f1e119dd1402fbb7bf29810138b8c'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'attempt'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1891c96ed0644ee9861fd549a941d6f0'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'source'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '19279ff775c5498390138a9a0e2427fe'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'confidence'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '193616903e384b5190a32a2460c2604b'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '197565942f374ab3b05da49e228770ab'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'ap_invoice'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1ae2c1df077f445e944c561b5a545d01'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'failure_mode'
                            value: 'validation_error'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '1af43901c07d49cfab1c8cf3529c0525'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1b47ed2cbfd74bdab80fc6ed00f2a5e3'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'processing_status'
                            value: 'review_required'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1b919a86460c479086fee2167c916ba9'
                        key: {
                            sys_security_acl: 'dbe1a721f3a34d8b8578c5bd66ff82b3'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1be8ee42e7474acbacc71e2f5122d4fe'
                        key: {
                            sys_security_acl: 'a257264a9d9f49bf9db8760b2286c6aa'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1c3d5a6ac63b4519bb2a63583a801a22'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'status'
                            value: 'closed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1c9bb19072f841ce86176e4b3af2b273'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1d189e1d1d804c43ad38c27d68f1ab7c'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'extracted_fields'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1d320847c0524e1dbf420e43c9281bff'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'customer'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1d50519fa83c4ffcb8f6200af0cb6371'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'currency'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1d8713724db54610b80f22bcdc71c95a'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'sales_order_reference'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1e2acaf774a6475f959332b18a39e7ae'
                        key: {
                            sys_security_acl: 'd04d1fab72c048a1aa3da6db20c8db5e'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1e2cf311fb934c33aefe2a78c9b17552'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'resolution_notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1e3fbf950957431292546e7f5c864f6e'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'extraction_confidence'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1e5bf05aba314a6b9797466a2c1d9a9c'
                        key: {
                            sys_security_acl: '4cb90e66103b475695e511079dd91a65'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1e62bb4b689a4e57b6904149027f0354'
                        key: {
                            sys_security_acl: 'd093bf86a04348eb9af642a988e41092'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '1e72ffba7ed74a5ea7f3104b01172085'
                        key: {
                            logical_table_name: 'x_695068_bcfa_ap_invoice'
                            col_name_string: 'duplicate_key'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1e8a3c1697194b11a14dc6ac7bb4e267'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'receipt_type'
                            value: 'grn'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1ebd3cf4600344cdb03b72506fa0dfbb'
                        key: {
                            sys_security_acl: '954ca23894b146ea98f02a80eb482a85'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1edcb8943e4644b9b3e58b9ecfa1a151'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'correlation_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1f031ccf88ce4be29620dcab12e1abb8'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'ap_invoice'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1f76938bb2234e5192d0900e309f40a6'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'claude_model'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1fb1ba0c1c5a472aa54502745ef27500'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'executed_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1fc9139d4f314bedbeaad6d46fc89d78'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '200f5bfa5e2148a5be5c75f8c2fb4b15'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '206dd6f800ec400ca8937d2ed637ba78'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'classification_reason'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '21311b67f5324a48830b61abd3160923'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2132070d43404dbaae02007abac51817'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'posting_date'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2135621d5b5b4e47b8f6ee8b5e5b09a3'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'material_or_service'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '21b4863d456a4620899b8fba4b57252c'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'approval_state'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '21ece4d636964523abc427df76b4a722'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '21f7d8c607814d12bbd481036185c4c7'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'resolution_notes'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '223e13043cbb4a8b9f4d9d962cdc5edd'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'currency'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '226c4937b2924092afc9db2ac1ea60e4'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '229eca1a2acd4f8bb63ebfb80ddccbe2'
                        key: {
                            sys_security_acl: '9772832986ee4b3db736de1a9a377737'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '22f7e54fc4cc4113936763a4cc0b8c27'
                        key: {
                            sys_security_acl: 'd641e8a7ecde48d6b7aae9d17768dfd9'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '2337b0a456b54b60b5ec3fe37b596c91'
                        key: {
                            sys_security_acl: 'c8f598159ed2462ebb324cc529b2874f'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '233c86f952734b9f982f9e43111ed568'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2364f7ea79764a5fa5731281d26ed77f'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'source_record'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '24371080666f4d2e863345b3389b75fa'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'within_tolerance'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2466eb297adb481985a812d8f73de16e'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'reason_code'
                            value: 'over_pay'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '24bcdf0a961e4ac4a2cdb483abccca01'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'bank_account'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '24e1189636b64572b0bfa67b37081a8f'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '24e1fd196b844ebdb6f4cb99b50db86c'
                        key: {
                            sys_security_acl: '07bad3145d774d169a165550dbec5132'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '25325d773150413b89859e46157f2996'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'completed_at'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '25d1368cb3f24adf9dfa285da189a5f0'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'result'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '25eaf8d6f3cf47d194d04690b708e7c6'
                        key: {
                            sys_security_acl: '809a8beda06447cab66c275294eea951'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '2609e7fd4c0a470cbe77cc6b6dd070cb'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '263f6f60555840ca801c1e9ba21c15bf'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'response_delay_ms'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '265c36c0d4f74edfaf1f31cb504a9e02'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '266f5da7208f4b79967217fa826eaf78'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'external_reference'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '267ed4772b864d6ea2407f20ec704d15'
                        key: {
                            sys_security_acl: 'd32c1b8bcefd4b2894a3ce7ac8036ac2'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '26829e33f3bb46b7b14385c5c697da24'
                        key: {
                            sys_security_acl: '0a5928e3157842e5a0301cdc6192ecb8'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '26d6dc0df2e44a75be84738915e7c41c'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'unit_price'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '272bcd8be1df450d8399acdc09744060'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'external_reference'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '27a6c0a2be564ea78f70d9d8f75b27be'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'domain'
                            value: 'ap'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '2814c4351b06413f976b7b9adcc4d594'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'alias_type'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '28892c1c1f9548bf9c1a392e7bd73152'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                            value: 'extract_ap_invoice_document'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '28a2b416a7644f9eb111e1b6fd6719de'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'country'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '28da4fa3bb1b44a1baa5e7a3378dff1a'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'customer'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '28fe441dff77455c9c4232909cf8fdca'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'event_type'
                            value: 'state_transition'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '292ec0f210c0434cb29d8baf2a0adeff'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'sap_document_id'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '29430cc9d7314b389454360cc3e8152a'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'extracted_fields'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '29620345019a426ea225b32bea073147'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'processing_status'
                            value: 'completed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2998cb448b5846279b28d7d2ce20b439'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2a6c9cd011a740fb8ad6ac216a2ecfcc'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'currency'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '2a7a544828734dfabe7fee8da68221f5'
                        key: {
                            sys_security_acl: '210a4ad048264094bdbeeb5fdfc5844c'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2a96c9c11e3d4d98b4b4d8927e8688e9'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2afdf333c362478c9200c7f27447fac7'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '2b66800fe6af46cd99ed49b2942703ab'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2bc5c1594100497bb7fb5f36b9bc9eff'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'processing_status'
                            value: 'failed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2c1f1b3e3bd5487b9e3933e74ee9e672'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'customer'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2c3f25d55c514bfdb8d034c1a9098348'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2c4a121b77104ed4920a6e8424c8e333'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'status'
                            value: 'duplicate'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2c73e2ca5534477d9590aeb4d5cb5b84'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'discount'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '2cc7aff21e7742cd9fefcf99f20bc30e'
                        key: {
                            sys_security_acl: '48658a85a5bd428b916c59a1e8fe5999'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2d362be587ba4215b1013200423bd48b'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2d530f824806427ab5e2e1f5d9d2c8fc'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'mode'
                        }
                    },
                    {
                        table: 'sys_ui_action_role'
                        id: '2d75aaa6f0cc45469d4207c68607f0e5'
                        key: {
                            sys_ui_action: '18b2ffb432d943449a162c7a1acfe9b3'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '2d7ab842be854d6eba83cad842661bb9'
                        key: {
                            sys_security_acl: 'b743afbaea1a49048f942e6d8b6ec8af'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '2d7aed55a9554aeb8f8b3d65dd83f654'
                        key: {
                            sys_security_acl: '954ca23894b146ea98f02a80eb482a85'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '2d877a35058c432b9e278ee470d63ab5'
                        key: {
                            sys_security_acl: 'd04d1fab72c048a1aa3da6db20c8db5e'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '2dc91697bc354a7c8a572dd6c8fdc7b5'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2dd3b6b67b1543c58738789e1e589e9a'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'event_type'
                            value: 'approval_decision'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2dd803d40c094e2a8e6df27d295a08d7'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'within_tolerance'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '2e07cba3d9904aa281ac9bb515cffe74'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2e3e58fa491c45a3b4b32754075d3363'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'failure_code'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '2e4c8126dc5240ffa82f1120bf2d996b'
                        key: {
                            sys_security_acl: '5be17f5e21434f15814cf0bc4dd02508'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '2e5a390022b140bebd432da4d86b7ca4'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'adapter'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '2e701c43caa940c196710b872cd7a014'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '2f5adb5185b74e8a91112a5ae6c53510'
                        key: {
                            sys_security_acl: 'aba58e17a9e94c2a880b87da9a863971'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '2ff1a9ff04c44346a36a34addc36b61a'
                        key: {
                            name: 'x_695068_bcfa_customer'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '30df8edd984c4fd8a271439fc844564e'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'prompt_version'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '30e58a6075a841048a6bf68d4d10ac2c'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'tax'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '30ea34c6ab734bbe87a4d8148dbda126'
                        key: {
                            sys_security_acl: 'f3bea3e6ce79409986fdd080caf698bd'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '30f7c228d4934179bf3305a6f5784d23'
                        key: {
                            sys_security_acl: '2493da00091a4402a52909bba343d167'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3190e3e5ab3c4709a4ef9e63c1a62a42'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'unit'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '321734bcbc2c418b810d743c8261ed22'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'assigned_to'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '323682ee1c194973bb89667d1ac4cca1'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'document_type'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '325873f671d543558683895e7d795435'
                        key: {
                            sys_security_acl: '02782fbbc50e4f1ab1cee081d5f03e94'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3263a6bce5a443d6bf5109f360e00b9a'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '326d4f8e186f441b9559c5a46272345c'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'quantity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '32a637bb6f8a4a15bac2107dadd0bf6a'
                        key: {
                            document_key: '10f7c4ad3d8c46889841a6386cbf4330'
                            variable: '989d9e235324220002c6435723dc3484'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '32f4066fa031468f878c9f79c7573820'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'country'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3391bcfe47cf4f53b3ee968d61aa0ff5'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'received_quantity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '33b31ca501734ced9623af263a2ac5e5'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'mapping_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '33cb6476bd384b4a825ab5b6ed5a9a3f'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'currency'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '33f3ef55c110433cb590d3d2607e21ab'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'occurred_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '34089411d3f049deb37f4fb8aff789de'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '344028f55f614df980b62b6eff76fa40'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'document_type'
                            value: 'unknown'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '345104f9284a48a3ac84e724cd2dddb2'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'attachment_hash'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '350db7cc93a642e1b919b1d9abb98925'
                        key: {
                            sys_security_acl: '767651e4e78945b29b70c9fb458937db'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '35815bb63a0940b982c4015f17366559'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'status'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '35d619689d3a4541a5b26245cdc82d91'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '35e23831e09a4223ba56d0a2c1766941'
                        key: {
                            sys_security_acl: 'aba58e17a9e94c2a880b87da9a863971'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '35e6ef88cc6646b0894305e2ab1cfaf7'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'http_status'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '35efb91da72a485889e3a41fe54c8ba0'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'received_quantity'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '368244a65e9a4edd9efe3b50723ed3a6'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '369dd915081d4d9d8500a123a4d18641'
                        key: {
                            sys_security_acl: 'f4f04fad2c224be78671c6c12a032003'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '36b1e0ec9f23422b8896fe7a0455a36a'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'notes'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '36ba42fa7fa24862b765350f05a857bb'
                        key: {
                            sys_security_acl: 'c4fe66868db849a68727cc00bd76381d'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '36dba4bdc54c4c1894cc67e38e88b8eb'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'mapping_type'
                            value: 'gl_account'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3760b17039c64c5890098b22cf9994c4'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'posting_state'
                            value: 'not_posted'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '37973dfa64b54b03890efb25666af9b7'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '37f792a8ad3648b4a7edbeffad09dd02'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'issue_date'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '382b8894d6644c968ac7a2cf62e0ae62'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '383473850f604748a5f0331dc07b8a44'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'source_record'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3844ae66f3f74486888593eaa21c293e'
                        key: {
                            sys_security_acl: 'acc1f8c84c364def8463a558e1163fd2'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '38c9ab780eaa4c16b191a54489bfe6d9'
                        key: {
                            sys_security_acl: '07bad3145d774d169a165550dbec5132'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '392c2485c9b8488987183ba149e85c22'
                        key: {
                            sys_security_acl: '389ff39dc4c940a0ab7496f8f6c433d9'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '393ca373c6ab49838b69db0cec55547f'
                        key: {
                            sys_security_acl: '7cff9e3ec5c84580af58603082596ac2'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '394de2cd767a4c66995950e81436c336'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '397888d238b94f0192dceed43f49fba3'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'ap_invoice'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '39bf6eeaf5c543b28fa37c209b412497'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                            value: 'recommend_cash_match'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3a0dbc7099f14badb97f0f9f406b29d2'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3a32d56e023246f49ddf5ff50b6f0463'
                        key: {
                            sys_security_acl: '2a4af0c45dbb4bee9f3d9e70f683ca81'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '3a3d3880a6dc4cebb7d3f3b9d0cf4cb2'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'decision'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3a68d14e23594dbbb4eb3ba2c5f676b6'
                        key: {
                            sys_security_acl: '99641f184ef048ac8fca75079cb31a01'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3a86e4cbe5ef440ea85cd72a27279fe9'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'reason_code'
                            value: 'short_pay'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3acdf8823afa47348d3ef4fd8d0eb593'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'alias_type'
                            value: 'legal_name'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '3ad0864f378046c2815cf3db0888ccb4'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3b37e352c96e46e0a9aa8e429374b04b'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'amount'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3bd21e1e6a644e8f9d1a1467487ff730'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3c80a9e903a3425c9a203b01c08358fd'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'payment'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3c9996f57993426fbfa53c737fb5afe6'
                        key: {
                            sys_security_acl: '632df7f0b6d246e49946a2cce8c2b8db'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3ca39ee559c54feab4c6866b29c62d84'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'approval_state'
                            value: 'approved'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'par_dashboard_canvas'
                        id: '3cca16bd8fba40ec8ca5845ac85967af'
                        key: {
                            dashboard: '1261313489914f5f8c098758149de3cf'
                            dashboard_tab: '88122ef923db439cb162a4de868bc70d'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '3ccf7c8bf28842f2835d8eb2e378f255'
                        key: {
                            document_key: '1e2cb716f551452199c8c3215c981014'
                            variable: '989d9e235324220002c6435723dc3484'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3cd0eee9f62548ffb7621b7910f5db4c'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'approval_state'
                            value: 'not_required'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3cf1f7eb19bf44bcb215fe7afa2f00c0'
                        key: {
                            sys_security_acl: '51784c1c72674738ab8bd18f3cafad70'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3d30950919074e7da8d996b7cca7817f'
                        key: {
                            sys_security_acl: '5794610847894c0cbf3d590cfb4b94a2'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3d4fb4ce89e7433cbd9f51474c94b82c'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3d748cbcdaaa4f3f8060eac896e11a41'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'mode'
                            value: 'simulation'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3d805e0e91af4a1381de6f115f96598f'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'correlation_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3d8dcd77768b490fa80191d50060bb97'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'invoice_amount'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '3d99a6b32c914af089ae177750cbfb6d'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3ea19f6cf0514777a000808c1792f849'
                        key: {
                            sys_security_acl: 'd04d1fab72c048a1aa3da6db20c8db5e'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3ea1e7f88e4e4e1497835cb53b7a7c1c'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'unit'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3ebe7111386d4468b29d120245b948e7'
                        key: {
                            sys_security_acl: '3bb5f2cb93cb48dfa4cf9a37e20f9946'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3efc915a6b864719b2da4d49eec8565e'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'reason_code'
                            value: 'duplicate'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3fe56d1fdfbb4199ab141543379d847f'
                        key: {
                            sys_security_acl: 'dbe1a721f3a34d8b8578c5bd66ff82b3'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '4004da50df4d41e188e7c4ca9f7c6960'
                        key: {
                            sys_security_acl: 'd093bf86a04348eb9af642a988e41092'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4016bab409414c3799909f55e826ec7a'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'number'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4034be0870584f63b29bc4125564cf74'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'document_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4052f90a121d4dd296c392fff4be664b'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'customer_code'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '406ed812b05d4e659b69393e0793e410'
                        key: {
                            sys_security_acl: 'd32c1b8bcefd4b2894a3ce7ac8036ac2'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '40abd505704744558fed6b58e50f29a1'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '40cb1ee85e4e4e8dadbe471632b0d5ec'
                        key: {
                            sys_security_acl: 'c392bf144fbc47cfade2aa5fe0d229f2'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '411ad4ea062a4757b8b008c532337215'
                        key: {
                            sys_security_acl: 'd641e8a7ecde48d6b7aae9d17768dfd9'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '417ec500704f4d31b25fbc047b5da946'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'mapping_type'
                            value: 'payment_terms'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '419526fc9e1841e9800e094051a08833'
                        key: {
                            sys_security_acl: 'd641e8a7ecde48d6b7aae9d17768dfd9'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '4196797b292e478caf676236ada8cb3b'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '42197f574d864d6a9f130a1fcdd9ed92'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '423342f0692f4dcd97b0a1c385065a8f'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'input_snapshot'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '42813098cbd84af59aabf40b975c892e'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'status'
                            value: 'in_review'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '42c4bf97eac14e518e3431d49fc3b1a8'
                        key: {
                            sys_security_acl: 'a257264a9d9f49bf9db8760b2286c6aa'
                            sys_user_role: {
                                id: '03604bf4100246588f4250676240bc18'
                                key: {
                                    name: 'x_695068_bcfa.auditor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '42d2382ed5a64453b4e3f01098cd994b'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'posting_date'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '4348f75d843f47b09e7e2eb123be8f5f'
                        key: {
                            sys_security_acl: 'dbe1a721f3a34d8b8578c5bd66ff82b3'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '43518bba707e4465b7fe6a14df0e794e'
                        key: {
                            sys_security_acl: '7cff9e3ec5c84580af58603082596ac2'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '436a16c49bf74e2098b2db5a56cfc9d9'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'reason_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '4411dd9103de4bdbb5468924b1e5459f'
                        key: {
                            name: 'x_695068_bcfa.admin'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '44615e132744446984d3029e885479dd'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'actor_type'
                            value: 'system'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '44631a57817641efa814f84199e90c54'
                        key: {
                            sys_security_acl: '656592e418c346938ae0a3da15134e7f'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4470471b585945d48bd4f68bbd21fc1a'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '447a0286264f475ab2b3e5130f4f810b'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'ap_invoice'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '450adc399cc24594a948159c8ea33745'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'tax_amount'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '45d4904c30064164957771dd60f05a93'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'source_table'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '45d5c252928f440da55367fe312804b1'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '465452d9e9774205b1892e9dfd73a0fa'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'correlation_id'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '465f32ad2482457185f284079306b7de'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '468d93acb28d4b5699455be436c64245'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'latency_ms'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '468efa600cb64dee8dd5a56df6e519a1'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'payment'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '46b31ecfd2f54a8c8ad191676365b4a1'
                        key: {
                            sys_security_acl: '2a4af0c45dbb4bee9f3d9e70f683ca81'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '46cffa6bf1ca4aceba9f6613ae6b7978'
                        key: {
                            sys_security_acl: '9872a75472714b048f105785d5354527'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '46e2cc82dfde42b7960264b29e5b0d2c'
                        key: {
                            sys_security_acl: '446fa06efbe5462186aa643f1c0bdb88'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '46f69ca8626d4a1290103bb2c04a6e7b'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'line_number'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '472d82eb8c634511879a8daba91b4c38'
                        key: {
                            sys_security_acl: 'd641e8a7ecde48d6b7aae9d17768dfd9'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '475070e41cc442f89e4b6f8990b2fdc1'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'ar_open_item'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '47a03f4976d84d0e817528c3dc507655'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '484c56f4217841e298f5752ea6093a3f'
                        key: {
                            name: 'x_695068_bcfa.finance_reviewer'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '48621d55570f4ff593c644a10429390f'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '488dcc9f997e4383a0ca9fbe3b084866'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'response_payload'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '48a488544ccf41febb3ef6be99fe426f'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'alias_type'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '49a397e1bd114b908b8930ee63eaf613'
                        key: {
                            sys_security_acl: '48658a85a5bd428b916c59a1e8fe5999'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '49b75155da86453a83040c12a8b1dbb9'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'rank'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '49cbc17aedfb423faf9412904bbf3511'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4a81a9b8b2cd4b138afd257a49d96d05'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'decision_notes'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4ab7622bf0594bdabfae35d59356a44b'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                            value: 'extract_ar_payment_advice_document'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4b03712386f84deba0d574d57d9cafc3'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '4b25835bc3a34161a8d9d8c4ada820ea'
                        key: {
                            sys_security_acl: 'e94b991c4b954494b225f3a86a9a7eb8'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4b53adfb847a451085dfdb7a97bc0926'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'decision'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4b7217d44997470b85b10781c62e5f90'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'operation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4ba0a781a178494fbddf59fb71030510'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'remittance_reference'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '4bd48ec2e1db440aaf6600707fec92cb'
                        key: {
                            sys_security_acl: '87c6a912c317412e9cc92697f62124c3'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4c271e52a1444ce08133bdb574d43861'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'payment_terms'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4c999618a7b94de0a513b2eddf427472'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'payment_allocation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '4cfc946351a34cba945ab8616f68e84e'
                        key: {
                            sys_security_acl: 'd641e8a7ecde48d6b7aae9d17768dfd9'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '4d080e34f1ae45d5be49b0f6490dbc6e'
                        key: {
                            sys_security_acl: '3366e1b1b362415eb5ca04148fb4aab3'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4d27aab0769f41b2a1ecfeb242f8d5b5'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'currency'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4d60c6a16cf341c59bfd457f34c5e21e'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'claude_request_id'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4d812d61157345c1862df4a9b633265b'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'extraction_confidence'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4e51b1bd3cb542428c9deed345fea775'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'reason_code'
                            value: 'quantity_tolerance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4e5c217d77b6496f9d259288a5287071'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_form_action'
                        id: '4edc47eab4c9497fac4283e8a388e4cf'
                        key: {
                            ui_action: 'd6364c9589c84fea88ccac365a8fdbcc'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4f8414eca0874e7398f147f8a345f24c'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'adapter'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4fabafd4d78e420580d353cf08970fc4'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'value_date'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '505f546578a849c0b08f8ce5c735b91a'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'decision'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '510711fd0ed74594a74d31a54927c4a5'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'correlation_id'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '510d186d00ad4004bb031d58fa240066'
                        key: {
                            sys_security_acl: '7cff9e3ec5c84580af58603082596ac2'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5185aae8168c485596d528a582b2c4c5'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'external_value'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '51a3d668049b4118b96538a5805cca14'
                        key: {
                            sys_security_acl: '210a4ad048264094bdbeeb5fdfc5844c'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '51a6c92d10424d6ba059eb0c95ded39e'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'net_amount'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '51c9f2e22d824c7b9bd95c87af185474'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'latency_ms'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '522762b37f5049179d8d95b8d14335cb'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'country'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '524e28e4e6aa40aa9071df97b7d074a9'
                        key: {
                            document_key: '0ed0fbb411da48efa9fa4608fc130842'
                            variable: '989d9e235324220002c6435723dc3484'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '52c58a52245949788ca8e64993f9f74f'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'credit_note_number'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '52f7fc3e1ab84e25bde7278229f84541'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'passed'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '533907aa97094e0b9aa94ef9c4360710'
                        key: {
                            document_key: '52e31c5ce1dd441eaea3e7dadd678f70'
                            variable: '42f2564b73031300440211d8faf6a777'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '537b5a14aacb4ce9b6d0b4307aab40ec'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'po_line'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '53b2ee1a33eb471ab26c21ca96c96354'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'payment'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '54053952f9824c90a6eb3c9ae2ef5763'
                        key: {
                            sys_security_acl: '3bb5f2cb93cb48dfa4cf9a37e20f9946'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_form_action'
                        id: '5429bf70a2964b2889915c9b613b2201'
                        key: {
                            ui_action: '58b6ffce33d24163b78b0a686390496f'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '54330c4ae41c4b5e99174f69d6ed52c4'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '54507b70bc55435d9a77c459432fe1b2'
                        key: {
                            sys_security_acl: '01be26244720441f8b35fc49276a89d6'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5452e7ca4d6b4326adba8aed620dc2a3'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'unit_price'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '54a6bf9c81df496785c7aa4589ac03f1'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'receipt_date'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '54b79dd5cd8f436abdd37492283dd11a'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'description'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '54d3f81d392a41b7a60478378fb47c89'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'unit_price'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '55238048cad74a728d247b9e7d5900c2'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'mapping_type'
                            value: 'customer'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '557b1f26bab74c22b6d3bd4b8b0475fe'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'adapter'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '55c9dc597e9741c090adb0627832f812'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'severity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '563fc6e816ea4c43b6ec9978f3a27520'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'open_amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5648826fd6bf4f41b3be6317a99e112d'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'external_value'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '565b63253516454dad52952227585c35'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'error_code'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '565f5f9e8390408987bac621aeb8de9a'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '56862337b0b545038524615066903564'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'reason_code'
                            value: 'price_tolerance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '56c322c32447446a97bf6ba5b00db564'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'created_date'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '56e35db728e249ff95fb33ea40e36111'
                        key: {
                            sys_security_acl: '0b98eded79d646d9bebf5c575ccf2a45'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '56e9493dd7004b1f970cc3892024b6e9'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'item_number'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '57018948cb974d62bb864917290d9083'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'external_document_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '578811ef173a4b23ae0a853bd9b2aeda'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '57a387562b8544e186bfd3e3b8a6dc25'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'receipt_number'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '57b2f0b022b344a5afc3ec5851f72ecd'
                        key: {
                            sys_security_acl: '83515683fa874c0ca534bb5862a102da'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '57c32f2fa1b542918ad104d7e72d800e'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '57f6e20bdd594b48910d709e12305e51'
                        key: {
                            sys_security_acl: 'e63e14a739c143dcb4f2761f30e7c0bf'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '580880c6a6984d4196632f71f9bac13b'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'ap_invoice'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '5816e6e1514d468d8d97505c3924126e'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'mode'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5831e359feba457a87e3d362394373d1'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'reviewed_at'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '583b7756a9764cc4b5f20c7bf6c180dd'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5864348b187f4ca587d07c4ac7e4924e'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'correlation_id'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '587b2254e3e140a2a110649c8fff57be'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'domain'
                            value: 'ap'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '588d615a5fea475bbe3422f50e91c218'
                        key: {
                            name: 'x_695068_bcfa.ar_processor'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '58df1d5fda6c47b5baceaf79e5384382'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'source_record'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '58f689be36ce41309f05bcc030ef1f05'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'ai_recommendation'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '594f9cf3d9284eb1b2ee68b38d750725'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'rule_version'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ui_action_role'
                        id: '595542b34565404195aed50c7826e838'
                        key: {
                            sys_ui_action: '58b6ffce33d24163b78b0a686390496f'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '59c8d260265f4ac68d65b787e28cb30b'
                        key: {
                            sys_security_acl: '01be26244720441f8b35fc49276a89d6'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '59ccc2670f1a477a86b0f9d1f65db532'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'receipt_type'
                            value: 'srn'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '59ff8338cda943bbbd86e3fd4bf0c3e2'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'deduction_type'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5a054376fe984736b3fa82bdea9a8ad9'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'company_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5ae26fbf0e48429994bfceffab3d057c'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'status'
                            value: 'http_error'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5b1ecbe740ff40f28699f0ee2ce9c3d1'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'state'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5b5e2efdbd8a47dcb3fd320df026b0c0'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'extraction_confidence'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5c3f2be5c8804245ae98e53277096cc1'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'assigned_to'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '5c44370f3ab3420f961df583aea1d9b9'
                        key: {
                            sys_security_acl: 'e63e14a739c143dcb4f2761f30e7c0bf'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '5c92b34472a740f1b918c8d670fd4bc7'
                        key: {
                            sys_security_acl: 'f6a9335063fb4f71944d32643a3b417d'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5d3df1fa803240c78ce454045a8161c3'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'receipt_date'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5e283a17cbcb4cb79e9e8502f51c9abd'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'duplicate_key'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '5e39c12e13fa4de4baacb074b1dfc3ca'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'processing_status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5e82966724d146a19694690a8f34e637'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'confidence'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5e98c3ea8f1b49e6b6878e0fde48bf87'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'allocated_amount'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5eb7a42b243a40ba9f7ef66a8b025448'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '5edc86c66c0145f3a6c17bec0321e7de'
                        key: {
                            sys_security_acl: '767651e4e78945b29b70c9fb458937db'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5f02ecd17c6c41cb8306370ae2f3064c'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'vendor'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '5f8406aec5e6417f8eee24f5f7097e6d'
                        key: {
                            sys_security_acl: 'e63e14a739c143dcb4f2761f30e7c0bf'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '5fa020fff5a1493aa14c697cda69c3b7'
                        key: {
                            sys_security_acl: 'f4f04fad2c224be78671c6c12a032003'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5fa3b16a04dd4679a9ef881916c61582'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'actor'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5fc3c92160cc40f4835e98013a65181e'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'allocation_state'
                            value: 'cleared'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5fc413b17cbe40ea8b381192d5337a2a'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'match_type'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '606f77296c7e4585a916f0f7f2950f91'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'status'
                            value: 'partially_received'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '60d003c9831a4692bb2468ccd381a479'
                        key: {
                            sys_security_acl: '632df7f0b6d246e49946a2cce8c2b8db'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '60e2adfa823349fe892639e94fa72ba7'
                        key: {
                            sys_security_acl: 'd32c1b8bcefd4b2894a3ce7ac8036ac2'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '611e414bcc94476ca13d30beb3be30df'
                        key: {
                            sys_security_acl: 'c39b37d54b874cd5bfe8e3f3ee6d5bba'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '612e3566883140cb978e48f6118e0b41'
                        key: {
                            sys_security_acl: 'f3bea3e6ce79409986fdd080caf698bd'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '614e02f6b4554c3cbc30cbd5913643de'
                        key: {
                            sys_security_acl: '446fa06efbe5462186aa643f1c0bdb88'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6156abe8228e4b7c9f120b749d26c039'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'assigned_to'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '615bff7d5fe8450590eb7f9032498ef1'
                        key: {
                            sys_security_acl: '2808bd04e43b4244984a91384e6b4694'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '615f6f9252274102b3701573be8e68e9'
                        key: {
                            sys_security_acl: '99641f184ef048ac8fca75079cb31a01'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '61a9579c29e04c7a897bcb13cb77bbc9'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'active'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '61d0435ce46b4547a1f6805048d13eae'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '61efdd31605c44ef99cc4d67c0c40f28'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '6218fd70554349b285b5088283319af5'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'domain'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '626ed2c364ba493fb6c474a5203e4c7c'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'processing_status'
                            value: 'extracting'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '628ad439745e4cbca0f3e53f68c81fe5'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'completed_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '62a40bf48ef14dff96f7862896d8c020'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                            value: 'rank_candidates'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '62bcc7549bf14e2bacc73a3a72d67499'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'rule_name'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '62f340ad2f214f1593ce6b30a56e5a24'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'match_type'
                            value: 'exact'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '631b4d7993554968b0a78b88db37762b'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'requested_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6357054a72224098aabd309f0f508e49'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'sap_document_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '63857bf8a6c542d5bde2625ee51123fe'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '638da3def3d14f88810f3394b43ed3e0'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'receipt'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '63ad8d1b6d4f4d899b16d0e569f8bcac'
                        key: {
                            sys_security_acl: 'c39b37d54b874cd5bfe8e3f3ee6d5bba'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '63bc3392dae144e8b42abcfaecae3d4f'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'reason_code'
                            value: 'customer_ambiguous'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '63ce4dac454941908ac69254bba96138'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'ai_recommendation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '64a33ac901bb4f3688ca027bc586a337'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'currency'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '64e76eede378453388daae605c4e26c5'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                        }
                    },
                    {
                        table: 'sys_element_mapping'
                        id: '65207e24d8c6400db9f88f9eb1a91ada'
                        key: {
                            id: '0ed0fbb411da48efa9fa4608fc130842'
                            table: 'var__m_atf_input_variable_41de4a935332120028bc29cac2dc349a'
                            field: 'script'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '6572eb2b7b244a06adec823c0cb6396b'
                        key: {
                            sys_security_acl: '07bad3145d774d169a165550dbec5132'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '65df2be0da944290851923089db90e6e'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'allocation_state'
                            value: 'reversed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '663c3f124aaa4d9a9e795df4351b5414'
                        key: {
                            sys_security_acl: '740ba163761147cc987137d848adb11d'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '66558b3b637b4806bd91c91041637aee'
                        key: {
                            sys_security_acl: '0dc596ee317640a8a854239ece6e4581'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '665a794e3205421a9ca7213766104ef5'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'purchase_order'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '66775a3ef69d408bb29722fd62870b61'
                        key: {
                            sys_security_acl: 'd2e027fe66ef4cf08ef4ab001ddda1d5'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '6680873d3ec04f49862ede94900c9499'
                        key: {
                            sys_security_acl: '632df7f0b6d246e49946a2cce8c2b8db'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '668c4eff81fb4a46920190b44caf7174'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'evaluated_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6697a1d2195742d5b45b6bf6fd3e7948'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'alias_type'
                            value: 'trade_name'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '671343c889244cfbb71e1f00f7234d34'
                        key: {
                            sys_security_acl: '22c841fbf736425e9f5dc93fec3c7589'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '67266b48ad6e4fa8b197ba5e518126b9'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'processing_error'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6762b338eda34ef5a050ee7127164ad8'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'deduction_type'
                            value: 'credit_note_netting'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6769c916bc3743718693a3f1b71e83cf'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'deduction_type'
                            value: 'tcs'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '679855dda3544f9aad20cd0365e6fb8e'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'reason_code'
                            value: 'duplicate'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '67fdb413153a47a5ae6b129759ea8827'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'source'
                            value: 'document'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '680c9a1bed1c464dbbc6d5094f437d9f'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'payment'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '68299d9b4c604eb68d3509cea1e2a3f2'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'actor'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '6830281b4cf3421e83f0c142db3a1ad5'
                        key: {
                            sys_security_acl: 'cc213a4fc5e143f68c7bb2b4917d132c'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '6837aff4abe64279908da6d81d39900d'
                        key: {
                            sys_security_acl: 'c8f598159ed2462ebb324cc529b2874f'
                            sys_user_role: {
                                id: '03604bf4100246588f4250676240bc18'
                                key: {
                                    name: 'x_695068_bcfa.auditor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6894d58c888f48ccbf4e29b441bdf095'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '689667352ff0495b8fc7805c2f15f88f'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '69568ec940bb4133868f7dab2b0f8ac4'
                        key: {
                            sys_security_acl: '096613b31c6b44939e4b1f0f77ed8bdf'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '697dad4d5dd3430d88018acde70c80bf'
                        key: {
                            sys_security_acl: '02782fbbc50e4f1ab1cee081d5f03e94'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '6984cea75d54451c97c1fdb03ef77902'
                        key: {
                            sys_security_acl: '9872a75472714b048f105785d5354527'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '69f2751bcc9546f0ae538f5851cdc25f'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'correlation_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '6a0fdfef6fb34e92a8e9c2a998cd624a'
                        key: {
                            sys_security_acl: '2808bd04e43b4244984a91384e6b4694'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6afba48a1dfd455fa2cd78d114b10781'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'mapping_type'
                            value: 'material'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6b22a704c972468dac9f1154550141c9'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'confidence'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6b31bb7e38a64e80962212c96af0ab47'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'http_status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6b7c995613cb41749427025a57bde516'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'attachment_hash'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6b805769133e42ada9ac9870da5cf37a'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6bca7ddcb46748b8b99eea64d6e7e681'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'decision_notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6c4a226f93724eddb6c209eacc1ed16c'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'source_table'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6c68d249b9aa400088c1e73daadb864f'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'quantity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '6c9abd94cceb4648a028b7db914d906d'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'deduction_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6ca679bd67e242629d64eb20b115357a'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6d15d19d376b48a6ad7b65b9d27e7f98'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6d3453707757446cac8f46d4af7654b5'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'tax_amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '6d623aeace584092a170387058531635'
                        key: {
                            sys_security_acl: '60f57bd780674e16b527c38a48cbc82e'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6d7fcc806db24190b30c2d9aef46d9bb'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'failure_mode'
                            value: 'unknown_outcome'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '6d86d5da658f4a7abb4c213a75f373d7'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'receipt_type'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6e29f48c812b48279da65956bd657a54'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'due_date'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '6e5d97d0cdfe4b6c8f90fc4db236d460'
                        key: {
                            sys_security_acl: 'f4f04fad2c224be78671c6c12a032003'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6e94ec9a2f0e46e88cfa15f72bcf5873'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'source'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6ed15acac7324867adc034a5359a4b2d'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'vendor_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '6edbe46ec7164aa4a5b612fe6f840fb7'
                        key: {
                            sys_security_acl: '809a8beda06447cab66c275294eea951'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'par_dashboard_visibility'
                        id: '6f7410588668400ea0e43e069a81d616'
                        key: {
                            dashboard: '1261313489914f5f8c098758149de3cf'
                            experience: 'c215f4d9f143466d887299f5ad790ee9'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '6faebaa6b55e4aa0871407687ef62563'
                        key: {
                            sys_security_acl: '0d26f90a165942f8b16b46948adb7d88'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '706d7c1d7a854d57bd418767e6ae94a9'
                        key: {
                            sys_security_acl: 'dbe1a721f3a34d8b8578c5bd66ff82b3'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '707fdc7528df42a9a09f800d1c95f851'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'sales_order_reference'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '70a6fe1d9e994b55ba0308a58232e806'
                        key: {
                            sys_security_acl: '3366e1b1b362415eb5ca04148fb4aab3'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '70bc251cd26046119e73a208a22c677b'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'open_amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '70c62a5e182c4e2cbbfc5b0446f5b4d9'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'po_number'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '70f73e0be715499988d01554111e94a4'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'transaction_reference'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7105ad1c929e40969ef2fac875831799'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'posting_state'
                            value: 'posted'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '7134af92fd3c42ee9a515572a28f75c7'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7135ff911345447c8bbb854f9a17c2e0'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'allocated_amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7173a55832b645d6890021bd21aaf441'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'decision_notes'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '71b029adb45e4b33bdd7de4912e09284'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '72347c4c335540b1b666eb1f576a4e8a'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'receipt_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '723b185bbf494a17a65ba2e9f8c47a91'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'actor_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '72a51eabefc246bc8296412ab7d8cc6b'
                        key: {
                            sys_security_acl: '656592e418c346938ae0a3da15134e7f'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '72c003fbdb534fbc9f76b7ab360eadd0'
                        key: {
                            sys_security_acl: 'd32c1b8bcefd4b2894a3ce7ac8036ac2'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '72d54e8689ac49099ae3f36cc0bd9528'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'bank_account'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '73059c4f8fbb47a3afb6d22cb99567cd'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'status'
                            value: 'technical_error'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '730b544e1b4d4815a4c114791d5435a9'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'domain'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '73735dda353449d59f374d77cc4a1822'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'ap_invoice'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '738a788af8c94b789bdc517538152fde'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'requires_review'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '73e57b836db549b4a84e4e78a11429b8'
                        key: {
                            sys_security_acl: 'c226c71d92d74ee6ad4b42d7acc26303'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '73feec5d72014e25b6628b1eae3ace7f'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'rule_version'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '742ab588630d4c47a034906fa678af3d'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'invoice_date'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '743152ac8b8d4930b8f54d763be1f0c3'
                        key: {
                            sys_security_acl: '050e3ac6cb7d4ce38612921c17872d46'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7473faa5d94e49c89bcc53ff35777823'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'sap_document_id'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '74993c7d868e44678f1455f461c0b829'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'source_record'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '74e7cd921c4343b98417b51009ef5858'
                        key: {
                            sys_security_acl: 'f6a9335063fb4f71944d32643a3b417d'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '7575910f5d914960bccaa7899cb246ea'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'source'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '75aff25258a44b328043619606aa3bf3'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '75e77d32ffff4cf7a8ebf20027a6f1b5'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'status'
                            value: 'pending'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7608a653b58240a3b99eddbe958163f3'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'customer'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_form_action'
                        id: '760a896e3d91492f82b077277b40c938'
                        key: {
                            ui_action: '18b2ffb432d943449a162c7a1acfe9b3'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7636500f1a6446b88ad93d481c43e20c'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'duplicate_key'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '767ef9b3e96b46e09da87852dc73936d'
                        key: {
                            document_key: '1e2cb716f551452199c8c3215c981014'
                            variable: '42f2564b73031300440211d8faf6a777'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '76aa1156c21a47dfabdb737cf517e82e'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'requires_review'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '76cbe6521b4e494b80ecef23ffe9f128'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'quantity'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7756a480d2824340aba1da42af6cb9b7'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'status'
                            value: 'closed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '77b2c4baf81845f1b9556e5e276b9126'
                        key: {
                            sys_security_acl: '93ab2691b20c4ca889355070bbe88c51'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '77b83fb73d454796a41040a615a45c24'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'status'
                            value: 'invalid_response'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '77d9564f921344d58f957ca4aa82a18d'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'tcs'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '77e468be02eb435daeae59d22720a0d3'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '780013163bb04113a9202c672906c9ec'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'processing_status'
                            value: 'new'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '785eb09c0f224ebaa5d993c7b4beab26'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'approver'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '78974851a9ee49b48a9276651e71c401'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'source'
                            value: 'email'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '78c8c9e354eb4568b7fa388041de971d'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '78e03b7b85354e6a85d273cc3ae5c88e'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'decision'
                            value: 'approved'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '78ffe15e3a6e4af4ba51328d13854552'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'status'
                            value: 'closed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7916cf34b258480ca8becdbc5e5b6ad1'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'initiated_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '79322003930d4049ae2d8a0a5c956bbd'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '79a5d89222c549dcbac2273c05c26ebe'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'bank_reference'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '79b36efcd794468fa9bb9ed13d902fdb'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'source_table'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7a4823d76dca42bc9fbba395b817fd12'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'material_or_service'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '7a845a1a4f20488cbe90deb071de1298'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'reason_code'
                        }
                    },
                    {
                        table: 'sys_ux_form_action'
                        id: '7ad99fb3124b49cbbbc026595a0f95b4'
                        key: {
                            ui_action: '83a2a055103042c8962ed9a56f25bef5'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7ade68356df0425890b84f3c572a0ada'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7b7ac8deb2f5431590ebcf369418afaf'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'status'
                            value: 'reconciled'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '7ba54af6523241d0894ced0aed5f5ca4'
                        key: {
                            sys_security_acl: '9872a75472714b048f105785d5354527'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7bec023661154a3f866bc0979c3ba78e'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'posting_state'
                            value: 'failed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '7c0c71648d3f45f7962066deef06839a'
                        key: {
                            name: 'x_695068_bcfa_customer'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '7c2283c1b870447f811572ff380c6bd7'
                        key: {
                            sys_security_acl: '16b882b598174209b9f03740f909d8b6'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '7c2da378640b48b2b4b8b8b47e7a1bb7'
                        key: {
                            sys_security_acl: '446fa06efbe5462186aa643f1c0bdb88'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7c349e2dfc3d46b088e799b9f30b0bf0'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'source'
                            value: 'bank_advice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7c4b525bb04045da92be8752e916de7f'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'source'
                            value: 'bank_statement'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '7cca3896c5594c729ebf47009b8bc072'
                        key: {
                            sys_security_acl: '3366e1b1b362415eb5ca04148fb4aab3'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7d4ae307ef2240fa83f06583c358a42e'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'purchase_order'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7d89a148075443c89ecfea53242f9950'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7dab719d7c3d41af8c7e8054fb4d32c8'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'allocation_state'
                            value: 'proposed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '7dcc9d00efe6434fa8ea2856472e47bb'
                        key: {
                            sys_security_acl: 'b743afbaea1a49048f942e6d8b6ec8af'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7e881d3d3246451db1afb268ff832458'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'rank'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '7eb146f1b86b4ba8a8b94940ce14ae18'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_ux_form_action'
                        id: '7ee8cc7858da43e4a86751f6989d8181'
                        key: {
                            ui_action: '0c62832a713c4dbf8f81283176b921a6'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7f66484a51e0483cbc356a195c2bac73'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'status'
                            value: 'cleared'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '7f8336156aee4e4fb75384d1b8dd2159'
                        key: {
                            sys_security_acl: '93ab2691b20c4ca889355070bbe88c51'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7fc44f2862054b0898006e0ad85d2428'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'number'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '7fe03ceba9c244f0b15ecd59c9ae46e4'
                        key: {
                            sys_security_acl: '2a4af0c45dbb4bee9f3d9e70f683ca81'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7fff14001e994ad2b428f7ba84500222'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'status'
                            value: 'approved'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '8086eb758c4c48148700cf36f1d9d002'
                        key: {
                            sys_security_acl: 'f3bea3e6ce79409986fdd080caf698bd'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8089f9c8794b43f29c9fae7072f32408'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'item_number'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '81726cc569d04c47bd45beac87a3c153'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '825cd0f9bac84694837bcf2978e9ffe8'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'discount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '8261c0a0261643dd87f8e681e6ece8c8'
                        key: {
                            sys_security_acl: '050e3ac6cb7d4ce38612921c17872d46'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8262d928b4644619b57efde6cccae8b9'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '82698a2ac78d44e2ab3b44fedbeca47a'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '826bcc8931234071846c6530c4d8b447'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '82baa43705804b4681f5c7535cb04908'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '82c4878703274012bd1f2a9c70b7f62b'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8300ddf99fbf4db0a5b35a387dabe49a'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'state'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8352525e734144978cc57e30abb6a6d7'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'actor_type'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '83cd6982c83d47fe848171aff7321540'
                        key: {
                            sys_security_acl: 'e63e14a739c143dcb4f2761f30e7c0bf'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '8409bca632a3430eb7a56387f244a74f'
                        key: {
                            name: 'x_695068_bcfa.read_only'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8415d13189914344ae222bf7c779a84e'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'reviewed_by'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8471c5a07d074ba0b4b72b58783f429e'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'decided_at'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '84c17f4ff38a4cb3afc6018ab90298d7'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'claude_model'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '84d8c14bebc54f7da0fbe78bb3b8a909'
                        key: {
                            logical_table_name: 'x_695068_bcfa_finance_intake'
                            col_name_string: 'attachment_hash'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '854334c650f948cfa69dd676830e0683'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '859499cbe91b4e6fbbffb75fff972b08'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'created_date'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '85c96f2e0aa447f58ce98c991309c719'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '85f61b0755134024bd71c9b3c2d499de'
                        key: {
                            sys_security_acl: '0a5928e3157842e5a0301cdc6192ecb8'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8612b04fbae54bcb81f8aeae04ee6a34'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'external_system'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '86132f25e2eb4180ada121fc4c9ea82a'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'match_result'
                            value: 'partial'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '86526438a25442869378aa6a9c222062'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'reviewed_by'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '8678064c2d2b40d5b368fae41623ba08'
                        key: {
                            sys_security_acl: '446fa06efbe5462186aa643f1c0bdb88'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '86a185cb773343e68ee3b3308c9d24ac'
                        key: {
                            sys_security_acl: 'e63e14a739c143dcb4f2761f30e7c0bf'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '86afadef9f25424faf35c3b01dcae7f9'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'event_type'
                            value: 'exception_resolved'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '86b52dd3100e4f5fbb06158b57308f67'
                        key: {
                            sys_security_acl: '0d26f90a165942f8b16b46948adb7d88'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '86c601f0739640df8b809ded8e94aea3'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '86f6ca9ae7084abe94a1aeb21de9f539'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'company_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '875ae6a7d813414a9fc841deb73a51c6'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'payment_allocation'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '87754c3433e74ec49d4949ed9d697e0c'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'document_type'
                            value: 'ar_remittance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8788a471e646430c8d1464b680e6a76f'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'invoice_date'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '878e51d7c8a64cb5aebffe46fadf571c'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'source'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '87a5a12415274faf8aba6cdcf1dc9d29'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'alias_name'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '87e73e054e884635ba181b0ca7a731d6'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'posting_date'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '887ce7967d1343c5af6bec300fb13292'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'ap_invoice'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '88bbe3e92f6a4fcea831336ac4f46774'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '88ee43b0420247a8937308c9d5028e04'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'bank_account'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '890bf4e87c424b39b04b224b9fd6c3be'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8965128802f241e6abd732f81ccbc763'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'vendor_code'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '89845d67d5fc4e6fa249317deb507e40'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'payment'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '89907f3292ec4f75ac83baa13937e3f3'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'status'
                            value: 'rejected'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8a1daf2a8f024284adb7b9efb422d29e'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'status'
                            value: 'open'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8a421d19974e45b29b26ebbbbdc9db9e'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'customer_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8a85d8abf81c4389a0220100b5acecf4'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'failure_mode'
                            value: 'timeout'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8ba938d40f1f435fafa9cc3d6e61ad18'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'payment'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8babafa87cd94884b43d21425f0bad7a'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'reason_code'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '8c669975847b43a28e823296235afff7'
                        key: {
                            sys_security_acl: 'c226c71d92d74ee6ad4b42d7acc26303'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8c677e943c4f4857804637e383282415'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'customer'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8c981da7233d457084bea0833f34715f'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'correlation_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8cd514608d9745038c45bfecd9e724a1'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'evaluated_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8ce6d0c1b596413aa1715bff218bf9d5'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'confidence'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8dd9bf89a9f34558a3de082454767fb1'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8dfcef9697684f5b9b48b5b9f55e8870'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'external_system'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8e03e920881f445e8cfdea5e93283959'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'company_code'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8e077e8b731640df9fd552af0131789d'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'currency'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8e241a5f8533467296e8cce930eec775'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'decision'
                            value: 'pending'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '8e4c4974b74c407e81ccf7305970e8df'
                        key: {
                            sys_security_acl: '0d26f90a165942f8b16b46948adb7d88'
                            sys_user_role: {
                                id: '03604bf4100246588f4250676240bc18'
                                key: {
                                    name: 'x_695068_bcfa.auditor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8eb5568cff3f4aa5931245c33e9e339d'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'gross_amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8efc7f3fbe5a42a8b186ba661b13af42'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8f66f16e96e1461a97ec95b6b43b9e1d'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'currency'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '8fea1e4413204120a0db0f1691a99c57'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '90982e151dec40279c4a577d486a2784'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'tcs'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '91053cc1ecbe471789b9b737039dda13'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'event_type'
                            value: 'integration_call'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9105a93a432349a9b18056bbb909e875'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'failure_mode'
                            value: 'partial_response'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '912b28352bfa4ab58c760956bf22944a'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'source'
                            value: 'workspace_upload'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '91ad9675033748448403ea74830a66e1'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'resolution_notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '91e0cf3a7f594ec88c7cd2ea06fbcca6'
                        key: {
                            sys_security_acl: 'dbe1a721f3a34d8b8578c5bd66ff82b3'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '9269f7f9d8594751ae3d356bf09d744f'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '932b3c73e81e480192f6988619e4f281'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'material_or_service'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9351ff4941034883aa654c1a7b2c147d'
                        key: {
                            sys_security_acl: '2493da00091a4402a52909bba343d167'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '936decdb202248128b917325644929f3'
                        key: {
                            sys_security_acl: '632df7f0b6d246e49946a2cce8c2b8db'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '93d944f07041497783fa490175214536'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'request_payload'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9468607a2b264d2c951fda39bdeb9cb1'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'requires_review'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '946ef0eb79d94d138f728b23a1d763f6'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '947b59cfbbb84c27967edbc4134ec502'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'classification_confidence'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '94cda376593a47c7ac6d16e56207bdb9'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '950fda426f2944aba8fd2970526060ac'
                        key: {
                            sys_security_acl: '096613b31c6b44939e4b1f0f77ed8bdf'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9518609c059a4be6be0d3ee8b82318f2'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'deduction_type'
                            value: 'bank_charge'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '956878fc492c40f79a9fe3c92ef9841f'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '957520d47b534755a3a1515d3c950d31'
                        key: {
                            sys_security_acl: 'c39b37d54b874cd5bfe8e3f3ee6d5bba'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '95995495596744bc8be2ef4a3650e820'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'amount'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '959f288cea22453e9b45565de05372df'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'match_result'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '95c9955d9bed430e9d8adcd4d360f4ba'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'output_tokens'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '95e9173a31bd44eba864403a467ec5c9'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'severity'
                            value: 'high'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '95eff11b0b264ef286ce195bdd36544e'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'approval_state'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '96139daff3e048309fe8c4d104401c1d'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'receipt_number'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '961876f797de4b79bdd0e664d7f12263'
                        key: {
                            sys_security_acl: 'c8f598159ed2462ebb324cc529b2874f'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9675f71e58fd406db40524973fd0bc3f'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'decision'
                            value: 'pending'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '967a212286ac44e586494d9e20c484ff'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'match_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '96a1c376bc23434092e476b36bd9598e'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'price_variance'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '9703eb0dc4a64657bda535be6eba1694'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '97bc7d849e4e47a6812bab051c0d7a9f'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'extracted_fields'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '98412e4e72484f45a219a945245a1259'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'posting_state'
                            value: 'unknown_outcome'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '987fa058362740c1aed888178d9da240'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'customer_candidate'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '98d66cf502344de699f8889b42f6a1c7'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '98edd486da0e4cb7855afb8aa2f5d10d'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'idempotency_key'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '990546554fd84cd4a3bb7f021e4c024a'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'match_type'
                            value: 'ai_suggested'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '99284299d0b6427ab8be44c6a0701208'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'decision'
                            value: 'rejected'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '99335ee8812c4b4785f9cf886bbd46f8'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'state'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '99c076ec8ef5497e85ee83ff773fb522'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9a0cb2221b3c4e07a5add2dc0b9de8fe'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'sap_document_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9a8b0902294745b4830086295fcbe5df'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'correlation_id'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9a9af06e0ed84ea882026abfc986a964'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'source_record'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '9ab93fd52eb448c2a57e42a6c797261c'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '9acc481d29e747aa86acbcc0ab7dfe90'
                        key: {
                            name: 'x_695068_bcfa_payment'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9b0ced687ce946b7b62206f0643fe5f3'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'retry_policy'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9b35a3924e17421b8658d7a05282122c'
                        key: {
                            sys_security_acl: '050e3ac6cb7d4ce38612921c17872d46'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9c0a16361af14c578b6f6dfd6fa523a4'
                        key: {
                            sys_security_acl: '3bb5f2cb93cb48dfa4cf9a37e20f9946'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9c1677d0d6dc4f66abb879de77179676'
                        key: {
                            sys_security_acl: '3a2f384a1f6244f68a801537a336a2a5'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9c2b4c00adfc46b9a5d5810bb9416fe2'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'actor_type'
                            value: 'simulated_ai'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9c5abc684120491f80f501cd8862a7ac'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'po_number'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9c7c4336c1ea4bc4ad5e205f8d29f167'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'input_snapshot'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9c7d38df35354b1e95370aa120e36ab6'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9ce142cb8b68424bb7687c5a7d51db9f'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9d0118fd0cf64a318061459e7a84adab'
                        key: {
                            sys_security_acl: '3cd32ab37fcb4ac0b26d66f71cc67b56'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9d01423a48b5402e9c6dd52397a31d9d'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9d024a72b98841c9ad0a566d3cefc74f'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'line_number'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9d1cedc0ae7b4ed69c80c0c66f2ba279'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'failure_mode'
                            value: 'success'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9d487f5593714a2bac9c9199032221ea'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'reviewed_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9db7a0f6730b4462bcbe6b8c636a6527'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'error_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9dd1ac569bd5453089640c6158c6c799'
                        key: {
                            sys_security_acl: 'ee6e1403798f4fef8533f0abcecd1895'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9e2aba8459ea4b929b514f2c6497bede'
                        key: {
                            sys_security_acl: '3366e1b1b362415eb5ca04148fb4aab3'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9e3ddf07b2aa4323a165a0f8f97f34ca'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'line_number'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9e424d25b5c641fcac449b9bd72bc38b'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'domain'
                            value: 'general'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9e8d36ea4029422da689ed5c4cbb8d8d'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'source_table'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9ed7a7a133e140afb6066ee6096d080f'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'transaction_reference'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9ee2b2bef4ef475ab95fd9f6fb9a9e04'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9f50c67cee9f4748a544ece4d4045626'
                        key: {
                            sys_security_acl: '5be17f5e21434f15814cf0bc4dd02508'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9f73ec438c2846b5af9f890fc3ef519a'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'mode'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9f90076f23314ef3a48c27482a48c6b5'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'resolution_notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9fa326ab808b4e5cbe480e2e69a212d3'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'before_value'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9fab110ef25d4c4fbe127f7add80df3e'
                        key: {
                            sys_security_acl: 'd04d1fab72c048a1aa3da6db20c8db5e'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a1220ad6ead34cafb3f9b28db26b7ca5'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'passed'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a161da2636bc44068c4d6ab6df9b9893'
                        key: {
                            sys_security_acl: 'd2e027fe66ef4cf08ef4ab001ddda1d5'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a182b4d3946a472e88ae444a2938bb3f'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'invoice_number'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a1ccd7dbbca74d3e90ead0e40946d08d'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'company_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a2096c6a9df84704979af17854442b90'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'customer'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'a21bf13afe9b47e3bb5acc7064c5fa83'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'domain'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a24df468fe3748eb88676742c597111e'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'reason_code'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a29624c2e4774cec86a39eb5fde65c39'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'status'
                            value: 'resolved'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a2a92455174b4ffcbfbbec44ca95c2f9'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'domain'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a2c549c08ff94c848e95d9244fa98dca'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'credit_note'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a31bc7d1545943f1b606e600f31e395e'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a333148963284fec962437dc03c1f107'
                        key: {
                            sys_security_acl: 'd32c1b8bcefd4b2894a3ce7ac8036ac2'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a34dae74b3974247aa55fd7b63721cda'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'assigned_to'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a3b674b9b28c49a3b745bd5814a261e9'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a3e663b92a1541a3add4079ddb202cd8'
                        key: {
                            sys_security_acl: 'c392bf144fbc47cfade2aa5fe0d229f2'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a4ae152810694cb5b29f6df4b3a81d45'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'source'
                            value: 'email'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a4e9b53ac7e743b6bfe089b10bde6864'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'price_variance'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a5a56d37ba464f2b894eacfc52b201b3'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'value_date'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a6100c346ade405ebd709cf7bb42649e'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'status'
                            value: 'unknown_outcome'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'a6482363497947e6918598898df68a49'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'match_result'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a66fb2fb694440bfa5655ea608801244'
                        key: {
                            sys_security_acl: 'ece4c82447a34cafb17810d3af76a1e0'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a6a0cb09b5154682aff2618663734e6b'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'mapping_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a6f39775644e4fd5a1443cf78efdac11'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'source_table'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_form_action'
                        id: 'a79e6675728a490ab0b3773e92bf33fa'
                        key: {
                            ui_action: '18d525d32dce47ce959ada18613b9a06'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a7e2725c8564409bbfc45a84b223f1ac'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'rule_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'a7fdb9ef52f84ccc90a626c8dbf45060'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a81d1cbaabd443f6ae31c2af6e59b122'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'reason_code'
                            value: 'vendor_invalid'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a8986a3c43e6430490e7d317f5c717f8'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'status'
                            value: 'validation_error'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a8d9089563874be691861472573f628b'
                        key: {
                            sys_security_acl: '809a8beda06447cab66c275294eea951'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a8fa1119aab24bb18783ead438a2eaaa'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'failure_mode'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a9150a98553f4ac4a04fbf6ddef0cd0a'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'receipt'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a9444dbde69645a6a0f67028deedb4dd'
                        key: {
                            sys_security_acl: '51784c1c72674738ab8bd18f3cafad70'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a9b2d66179a3459285c6941bda2d45c8'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'customer'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a9d0ce354909456fbba8b6a3c82b2ca6'
                        key: {
                            sys_security_acl: '2808bd04e43b4244984a91384e6b4694'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'aa0e3c9c399844248eaadb095957e5d2'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'source_record'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'aa81e02c4e52405badc76f616d36917d'
                        key: {
                            sys_security_acl: '5e39af44719e4f478a2a94713cdf98e3'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'aab36984573c47f280edfc96060b9673'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'domain'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'aacfcb77edae461c83f4f41410a0b209'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'correlation_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'aad44eac684b4d0392d9466b24364ef7'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'processing_status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_form_action'
                        id: 'aaf87f83a182415b955ee77df5673e82'
                        key: {
                            ui_action: '2281a5684eea4af5b8e9850af7186ac9'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ab93655f96c34598ad7fb573dad544ab'
                        key: {
                            sys_security_acl: '3bb5f2cb93cb48dfa4cf9a37e20f9946'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ab972c6af7e8491abec7d5b89637299e'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'receipt_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ab9ac668de9a4d72a627147d5944d32b'
                        key: {
                            name: 'x_695068_bcfa_po_line'
                            element: 'unit'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ac2c38e06dc644d68047adbb74382e3d'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'retry_policy'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'ac3938dbf0b147799d9272f350d30b9b'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'acd45fdd437a4b6182fe0c44e7f119c7'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'country'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ace0fb7b201b4e1aaeba7f444d0b644b'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'posting_state'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ace8c4aa0fe0486eba0e5c9c691ab893'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'source'
                            value: 'simulated_document_intelligence'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ad6a683b8b2d4ce88e0f3e53a87dec5a'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'document_type'
                            value: 'ar_payment_advice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ad74984c8af442eba4c679fa8c81b4ae'
                        key: {
                            sys_security_acl: '0b98eded79d646d9bebf5c575ccf2a45'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'adc57f82030741ed9b2b9dd0df9d1be5'
                        key: {
                            sys_security_acl: 'a257264a9d9f49bf9db8760b2286c6aa'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'adc8240128d74b0b8cfb0942d333b06d'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'status'
                            value: 'closed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'adcb23d3d28e46eaa69891ab9cca7f81'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ae3542736be844499278475b09f03f70'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'reason_code'
                            value: 'other'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ae9f6f2058754fa4bd4a9ac6d2aa38cf'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'event_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'aeb65a7a52914c0e9156b2f5a3baf33d'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'prompt_version'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'aec62c5ccc3841648de73eb481eaae13'
                        key: {
                            sys_security_acl: '3a5bc2a915f246a1a5082dea10a03ea5'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'af10c2b4d64a4acebd0fd4e83cfca158'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'unit'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'afc02341740a40e998c70d77329c17eb'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'event_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'afe0d152150448b6a9fa88011b7821fd'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'internal_reference_record'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'aff76e76426a4026bf0c3eaa13c8ae24'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'status'
                            value: 'open'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b0c82fe1ea554b41b8b58fc155c676a5'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'approval_state'
                            value: 'pending'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b0ec0cb3da1d44b9ac755605a672b03e'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'event_type'
                            value: 'ai_recommendation'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b122da0507df44c7838f8a284e27d919'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'quantity'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b1719c225ff645a2b1493e9c6de80e18'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'reason_code'
                            value: 'po_mismatch'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b184a2bd107340d08b8eb25491429fd8'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'classification_reason'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b18ce85be7b845419d02ff906bd908e7'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'due_date'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b1ae97f9f57d4578bf7680705bbdea61'
                        key: {
                            sys_security_acl: '3bb5f2cb93cb48dfa4cf9a37e20f9946'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_element_mapping'
                        id: 'b1bb03eede724fb7bf4c691d1d7b9498'
                        key: {
                            id: '1e2cb716f551452199c8c3215c981014'
                            table: 'var__m_atf_input_variable_41de4a935332120028bc29cac2dc349a'
                            field: 'script'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b2783fc3ccb444498aff60aa4fe2099e'
                        key: {
                            sys_security_acl: 'f3bea3e6ce79409986fdd080caf698bd'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b2dabafeb31c4663a25b3144fd44ac43'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b2dc2e9057b64ec6b9f2150e3465b0e4'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'status'
                            value: 'open'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b2f8ae3134914ff0b926f44e573c0f0e'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'decided_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b2fa0a314d294326b68782bbe4914df2'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'company_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b2fcdee564544092b7b824941fe0df30'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'quantity_variance'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b2ff673a1b334c47b217d71b634e8205'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b30d4384aeb84092b47374c1ac78e331'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'domain'
                            value: 'integration'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b3107796cd2b44b5a4d9e857801d74c4'
                        key: {
                            sys_security_acl: '00f8486d465045a6a28a69dea22a3077'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b31618fa6ade47a2abd014d0d61893c8'
                        key: {
                            sys_security_acl: '389ff39dc4c940a0ab7496f8f6c433d9'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b3447b6b24b74d8db33cf652a2d74cdd'
                        key: {
                            sys_security_acl: '9772832986ee4b3db736de1a9a377737'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b393463c80884f4281b08e44423c7341'
                        key: {
                            sys_security_acl: '07bad3145d774d169a165550dbec5132'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b3b1bbc3268a48358032c4ad52016aed'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'decision'
                            value: 'rejected'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b3d7215fdf26400da5ffe848348f8b03'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'status'
                            value: 'credential_error'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b40ecd5b1db24005b110f799d256169a'
                        key: {
                            sys_security_acl: '446fa06efbe5462186aa643f1c0bdb88'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b49b92d03f7843fc9b5e488faf6b5b73'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'purchase_order'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b4c0c149cbf54b429f3ed5ac76877c94'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'reason_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b4d58fcc0dd146619c7210b35117d293'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'source'
                            value: 'claude_document_intelligence'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b51e9622a292436da4518db98124946e'
                        key: {
                            sys_security_acl: '48658a85a5bd428b916c59a1e8fe5999'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b51ebdebdfe94e60889eb5adb5880a09'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'ar_open_item'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b553e048594a401c9c50be85d26b6f88'
                        key: {
                            sys_security_acl: '32ba172e87a347538c62c40d953598ea'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b5988a43975041c6895e04320e5c48be'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'document_type'
                            value: 'ap_invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'b5a8556149aa4bb587e5abbc9d48ee1d'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b5e7acc7e90a444db1bce1e0f5d6c21a'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'reason_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b65486b9ea2c40efb8c3d5119572b8bd'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'match_result'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b6580cf9d8de487cb4786d31f085fa15'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'source'
                            value: 'shared_drive'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b668046ff64b47c0b751bcb1596540cc'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'actor_type'
                            value: 'claude_ai'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b67f272849db40f18cb6f6e639ec16c1'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'source_table'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b6aa0e7843894a49bb296c6f429e43c0'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'state'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b6da9c99fd6f4a7e971010a814e321f9'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                            value: 'classify_finance_document'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b70792a4e5ae4418954aff15d96044ef'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'status'
                            value: 'failed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b70e5249d781495a814209009bc1740d'
                        key: {
                            sys_security_acl: '7cff9e3ec5c84580af58603082596ac2'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b71b55cd3ef64816b420c5a1cbb3d6f0'
                        key: {
                            sys_security_acl: 'f3bea3e6ce79409986fdd080caf698bd'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b7416bf019b844b8a732b6831c978c53'
                        key: {
                            sys_security_acl: 'ee6e1403798f4fef8533f0abcecd1895'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b7d71ab86f2149eab4fb6daa3aee0625'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'reviewed_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b7ed8c4a13504ea5b7680c14818a70ac'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'source'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b825069592664f2a8cb8a0f7c8c29261'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'safe_error'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b8413a0c783c40e4a855cd4c201e5dd5'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b846ce29bc684c16ada67a02a9b00705'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'domain'
                            value: 'ar'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b8a75dcdb4424f3aad265e24e3c5a9a7'
                        key: {
                            sys_security_acl: 'f4f04fad2c224be78671c6c12a032003'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b8dd84d1ac0741e3a78ab88d46d1ec64'
                        key: {
                            sys_security_acl: '9772832986ee4b3db736de1a9a377737'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b90c56532c33402688913f8c0594570e'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'confidence'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b91a87589b584fce9bc6d34ad0a5e7ee'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'status'
                            value: 'resolved'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b9781b9f824a49b1a23b7a241b2a1a1f'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'company_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b9b7cd274d924f0896b1458b2a924308'
                        key: {
                            sys_security_acl: '07bad3145d774d169a165550dbec5132'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ba6483427be3455e96afd90cf1096c74'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ba81f1f7e9534565a63ab82772cb1889'
                        key: {
                            sys_security_acl: 'd2e027fe66ef4cf08ef4ab001ddda1d5'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'baac925520a044fe9142ec4b96df08e9'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'company_code'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'bad2fe92566e43a3bac9f06392142324'
                        key: {
                            sys_security_acl: '7cff9e3ec5c84580af58603082596ac2'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'bad4476c64a94ace9170c7b05ce34c9c'
                        key: {
                            sys_security_acl: '3366e1b1b362415eb5ca04148fb4aab3'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bb3c90aa62eb4119b748941c7d62f5b7'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'purchase_order'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'bb7ce05fe7984f548d88cbbe726f652f'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bba1b54dd352408f9bc9ec3ec6719b60'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'domain'
                            value: 'ar'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'bc0b68ccdb614136bc171f6f15171fcf'
                        key: {
                            sys_security_acl: '12f4ad253d554352ab0a05e0576730fa'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bc62218a80f9484f9b1cf4b0563b7fc3'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'decided_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bcda58e0b5804500b04b1313ceaa0821'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'confidence'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'bce4d1a97677438d902d6b5391e503a8'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'posting_state'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bd32e2f2515d4c9cab3c3c8aebf9d5eb'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'tax'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bd498531d4b64bfaa09bdd12924a9c21'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'payment'
                        }
                    },
                    {
                        table: 'sys_element_mapping'
                        id: 'bd7be2b5e2d544d6b088a66c944b987c'
                        key: {
                            id: '10f7c4ad3d8c46889841a6386cbf4330'
                            table: 'var__m_atf_input_variable_41de4a935332120028bc29cac2dc349a'
                            field: 'script'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bdb5b24d836744c9b745c1e3faafbae9'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'allocation_state'
                            value: 'approved'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bddf813e7be5406b9bff521318f6255f'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'source'
                            value: 'manual'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'be798a8b099f4ab6b2515123beaf2067'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'net_amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bed41a8f657446e8a7896f8c1d45c97e'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'ap_invoice'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bf09ae2f06824010b0582c2f6ce9b393'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'idempotency_key'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: 'bf505b5092574a7fa59a01048550571a'
                        key: {
                            name: 'x_695068_bcfa.ap_processor'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bf5b1d39ee2845339d30f7169a01d10f'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c010421ba31d42b5baa3a3f4f6b5f5e4'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'assigned_to'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'c022149f3a9b4325a1e893bd563ab5a8'
                        key: {
                            name: 'x_695068_bcfa_payment'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c062f6ae2d64478ab1a7e0613052c225'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'claude_request_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_form_action'
                        id: 'c0c743c1cce24705903c0d1fcb89b0f6'
                        key: {
                            ui_action: 'f13745dac6a540a28a8ce31af80d2ad9'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c0e1416cc3b5427fa4fec1490d0b85a3'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'response_payload'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c0e23ac8e39a4eb6bc12e86d4e024dfb'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'reviewed_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c158663fe27541faa9bc79dcdfb2ecad'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'vendor'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c1a76879b04641a2b7f4d45fac76a17f'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'currency'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c288e6da4f764df59d9fae3653374597'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'bank_reference'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c2b17fed4b214851bca8aba8cb6119d8'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c2d3227126934486a6164c7804c8c7d9'
                        key: {
                            sys_security_acl: '87c6a912c317412e9cc92697f62124c3'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c31a6967f4d344b894881c78ed45236d'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'input_tokens'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c3a66aecc9c14659b78d42157bb1883d'
                        key: {
                            sys_security_acl: 'f4f04fad2c224be78671c6c12a032003'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c3c6158c897340b5a1bb3ba44b955c1f'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'po_line'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c3ce983306904056b03a3a34b447c241'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c414aa8fbfd44e359a14f978a0e8ded8'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'vendor'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c42bcebfbfdf4eb7b8db3f98c6696553'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'adapter'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c42e511bc2004dac81e88db6c71bd78f'
                        key: {
                            sys_security_acl: '632df7f0b6d246e49946a2cce8c2b8db'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c4a5af7241d645f6b360bc08d84b72c4'
                        key: {
                            sys_security_acl: '22c841fbf736425e9f5dc93fec3c7589'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c4f27981659b452f827515ad3458d430'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'external_document_id'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c533c6419b504699b943f42e56ffc2f1'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'reviewed_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c53cd237d5124e95a4598319eb2bdc25'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'reason_code'
                            value: 'low_confidence'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c55e4a677be94157ad4261faf55dd4bf'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'status'
                            value: 'in_review'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c5d32308ab1d4c55b53b3087744021cf'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c5fc0958edb148348aa5f538edcbedb1'
                        key: {
                            sys_security_acl: '446fa06efbe5462186aa643f1c0bdb88'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c69878d81fa14fccb0b61d085c57eac5'
                        key: {
                            sys_security_acl: '2808bd04e43b4244984a91384e6b4694'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c6bc83477aa94259af4ee6a18055400f'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'selected'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c6bebe4162df49909e205d592dda0e27'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'adapter'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c6d7292372b54864ab920214fa2a43ab'
                        key: {
                            sys_security_acl: '6f526450085c42bbaf2d25c61d0d4d2f'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c6d7685878a04357be4a975dc150b9a7'
                        key: {
                            sys_security_acl: 'e94b991c4b954494b225f3a86a9a7eb8'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c6de0273483647f082e36fb3eb7103d3'
                        key: {
                            sys_security_acl: 'c8f598159ed2462ebb324cc529b2874f'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c6e1586537a24ea6a5d04890ee7d904a'
                        key: {
                            sys_security_acl: 'acc1f8c84c364def8463a558e1163fd2'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c785b057ee6740ea8e3535451360c55a'
                        key: {
                            sys_security_acl: '0a5928e3157842e5a0301cdc6192ecb8'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c7bf675bf16f46a9822e1ffd33d223e8'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'approver'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c7c67556473b4b889a07279b92881410'
                        key: {
                            sys_security_acl: 'd0945417b2614665ab0ded3deff07c5b'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c7db4f62b73948b08ad3f303afa43e3d'
                        key: {
                            sys_security_acl: '2808bd04e43b4244984a91384e6b4694'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c80f20bfd9d84b20ae125be4df977d0d'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'tax_variance'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c818400b5f2149fd8ef54fda449c79c5'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c821431a68a5410f94aa43ab55049e89'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'status'
                            value: 'open'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c848dab1a524425fae3fd07f72f27dac'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'customer'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c8749639f9a044568b63ab3f0eb34178'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'vendor'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c903db324e774682af42d7eea737983a'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c9531059ab8b4fea8ef36b44186feb63'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'status'
                            value: 'partially_cleared'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c960f2cd9cd14e0db4c82da2054ca9cd'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'status'
                            value: 'disabled'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c9684976d170499c844f9542480de22f'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'description'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c9800c00e90346869a65171e9e747222'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'mapping_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c9b7d117eb904f529cdcb63066fda816'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'requested_by'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'c9f899717a564c3f86b10a9054e50f43'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'c9fc61a4e20c405783caaaad5db80094'
                        key: {
                            document_key: '52e31c5ce1dd441eaea3e7dadd678f70'
                            variable: '989d9e235324220002c6435723dc3484'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ca13f962ec0146feb668c5c0aa5764d1'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'failure_mode'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ca36e1188f534d4085fddec1017572da'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'status'
                            value: 'applied'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ca3a918a66cc48ea834fb2055f93b05e'
                        key: {
                            sys_security_acl: 'd641e8a7ecde48d6b7aae9d17768dfd9'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'caf5b13ca8ec4053ab15e81578f535f4'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'error_message'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cb0fe80e793143b28998bec67e49e149'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'confidence'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cb9bd8f9d2a648548ddd2b064fb16e0f'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cbc4204e2ebf4213a95f663ea2da7647'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'source'
                            value: 'email'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cbdade6ccd8b41299449a504445ad8c7'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'payment'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'cbe02e4cf36e48d3a533c798d3336bb9'
                        key: {
                            sys_security_acl: 'b8330c8ec54843fa91afc2d3090cf5e5'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'cbf9ce32837f4f3ca3b73007c44fe51a'
                        key: {
                            sys_security_acl: '83515683fa874c0ca534bb5862a102da'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'cc4508ef47d043488ebe0aece8bc0540'
                        key: {
                            sys_security_acl: '740ba163761147cc987137d848adb11d'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cc6aacce350e4d5c837c9d8a88545d3e'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'correlation_id'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cc7c4284d08d4fa9a2b5555e9094cd31'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'internal_reference_table'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cd1f286ac68c4fdbaeabe5cc021d43e9'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'confidence'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'cd25df2e67324eb7b89c5991f1e98cf0'
                        key: {
                            sys_security_acl: '809a8beda06447cab66c275294eea951'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cd3a1aa7715242f7bc2a22d2aac49df2'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'source'
                            value: 'shared_drive'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'cdafb79a7375467584ca333460528d8c'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'reason_code'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ce0e130602be4b06935f841b9fba464b'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'quantity_variance'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ce3892a93d0c4dde8af18045281435a7'
                        key: {
                            sys_security_acl: '5794610847894c0cbf3d590cfb4b94a2'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ce558664170a4c4ba54f9bdae3c8a9bc'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'po_line'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ce8bc45a55d849a696e5456fe059a8ae'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'invoice_number'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cecf81b6acbb4dc08d41ed9471c3ea25'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'alias_type'
                            value: 'misspelling'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'cef910ed340c406a949bbc15dc6ec72f'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'cfb09ac42a194701a4ceb651b7fb3aee'
                        key: {
                            sys_security_acl: 'c8f598159ed2462ebb324cc529b2874f'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cfbee6d6a4e347688d6c83b209ea7a56'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'processing_status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cffaa6fabaa24a3d9846465e220c808b'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'ap_invoice'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd04d0d84732945808d0069babddcc8d6'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'decided_at'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd07d7652f3d6422991af5abaad02062e'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'reason_code'
                            value: 'missing_field'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd0aad7fdb6284fec961822cae3841201'
                        key: {
                            sys_security_acl: '2a4af0c45dbb4bee9f3d9e70f683ca81'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd0f34f2fea67448ab36e9299875604b2'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'after_value'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'd132e0c928894abd88d337457009df0b'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'd140ec0575f5465aa3cce4c8a9bfa255'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'severity'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd14423468cbf4ef38a78878ee3c9421c'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'requires_review'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd20b7fbce17b4978bcd0ad2128222d75'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'bank_account'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd28df31904344053b1cf9dfb812f6d6e'
                        key: {
                            sys_security_acl: '6e927aab17524583ac6e3549985e6968'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd300b65eeec34d018454ad5f36df8cb3'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'event_type'
                            value: 'exception_created'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd332f2c56dc947f6ae95291ba25a4580'
                        key: {
                            sys_security_acl: '00f8486d465045a6a28a69dea22a3077'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd33dc05c613c4c278b360307d17eeac2'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'severity'
                            value: 'critical'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd35150f18961410bac9ef0472796b5e4'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'payment'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd385ce0ce3d24bb7bbb90a1f270809da'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'after_value'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd39e353dbe374438af2b5dba7cff33ea'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd3a75e1209f14087a7abeb0408324317'
                        key: {
                            sys_security_acl: 'c39b37d54b874cd5bfe8e3f3ee6d5bba'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd437f3d9eed7459cad0abac1dc087a02'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'status'
                            value: 'success'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd43fd5ed3a084c4cae412b5d10d7dffe'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd446ac198f9c4859ad52f2dd1d10fba8'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'status'
                            value: 'resolved'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd4685a6f16a643609170b85cc050ead4'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd48c699a295949728a4f6bd916b4708c'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'extracted_fields'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd48e18697643401089363256eeeaf75e'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'correlation_id'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd5a4996d706c41d59af30061740240eb'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'internal_value'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd5ba9bb289744637891cc1d32691228c'
                        key: {
                            name: 'x_695068_bcfa_credit_note'
                            element: 'open_amount'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd5e4595d393a4de987b2d4ab46e2ea90'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'correlation_id'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd69f635bd7744ad69d98a12dd7db4114'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'before_value'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd69fec9898aa4135a862108e65759f55'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'remittance_reference'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd774f02f91fa46bfb261f11cb8278549'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'adapter'
                            value: 'mock_sap'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd7838149b0e34db787240f9d9c1a9e27'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'domain'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd78a1e212c594247802509c16677372d'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd7c9ce332dab47c690ebb605bfdb0502'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'selected'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'd7fc45a6e30f448d865a6b92996c4816'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd80d2fb290404385b06ddbdd90f0280a'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'deduction_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd8870105ce1e4d16a0a608fde25e03f1'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd89584f3cadc4ad48c9290eaf313dd05'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'company_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd8a91da6aa9441c3a69a4b4f74ecdc6d'
                        key: {
                            sys_security_acl: 'e34907d73fb04d388c55e0e99e602c82'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd8bb1795b940495d8151308541983e5d'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'match_result'
                            value: 'matched'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd94ce3d59e884135b34f0461b4574592'
                        key: {
                            sys_security_acl: 'e34907d73fb04d388c55e0e99e602c82'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd995c7cb659c4041bef2ec027d468a17'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'reason_code'
                            value: 'unmatched'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd9d79559cf864b0a8ffa021beb1300d9'
                        key: {
                            sys_security_acl: 'd04d1fab72c048a1aa3da6db20c8db5e'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd9f140fb73a54bf4a3657669d80e5434'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'received_date'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'da1de63df084462f94711c1dd7a5b53b'
                        key: {
                            name: 'x_695068_bcfa_purchase_order'
                            element: 'currency'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'da22638efa4847b9990afcc41d27f455'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'da2c7b221c954fada40a43c5a4660a12'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'source_table'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'da8ab39506d24391b90c2179e87ae62d'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'correlation_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'dabcf2b8349641f18140562e5a3aec19'
                        key: {
                            sys_security_acl: '3cd32ab37fcb4ac0b26d66f71cc67b56'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'db23d15d2bbb432ea59a9505c8bd69b0'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'attempt'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'dbd3e267daf34461b76e3b72ececd561'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'reason_code'
                            value: 'tax_validation'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'dc1ee6afb08b4538bf717d499ef4d8bb'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'open_amount'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dc44302b8432408ca2be79df8a87f2c4'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'dc8953cd80dc47f2a0d200b55cbab39d'
                        key: {
                            sys_security_acl: 'cc213a4fc5e143f68c7bb2b4917d132c'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'dcc91f618fc9482495ad67f35c80c97b'
                        key: {
                            document_key: '10f7c4ad3d8c46889841a6386cbf4330'
                            variable: '42f2564b73031300440211d8faf6a777'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dcce3c42390c4d6b9e44cb97e322003d'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'dcd0a71f9d8046f3af7e4ce70fcbdb02'
                        key: {
                            sys_security_acl: '767651e4e78945b29b70c9fb458937db'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'dcd148061c75441bb69ec424bece7dd1'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dd0a8cb8847e4687bd6de7c4e993305a'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'alias_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dd4244f92ba0471187aedc382555a192'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'processing_error'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dd65d6855b03409387c46cce7ad87e26'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'received_date'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'dd7f1af3aa4f4d1a940b1ad187573759'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'dd82e075d1824db6918b6efff2f15c01'
                        key: {
                            sys_security_acl: '48658a85a5bd428b916c59a1e8fe5999'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dd8ec601ce0c4ff9943534b5a0de19a1'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'classification_confidence'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ui_action_role'
                        id: 'de8f576f1e6c4bacb586369264dfacda'
                        key: {
                            sys_ui_action: '58b6ffce33d24163b78b0a686390496f'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'deaf8895c3404913a0d556ee2b6058d5'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'source'
                            value: 'manual'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'dec671ad82c54882bddfaab4e7effbed'
                        key: {
                            sys_security_acl: 'ee6e1403798f4fef8533f0abcecd1895'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'defefaea3faf4a37a04b34f63fe8ea48'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'extraction_json'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'df0056cc830c438d9384b1d9c579542f'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'reason_code'
                            value: 'currency_mismatch'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'df609753d1654b10ab57d058f977fb72'
                        key: {
                            sys_security_acl: '2a4af0c45dbb4bee9f3d9e70f683ca81'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'df6ffe07e6564c328a6c32ec937c7961'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'decision_notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e0246abc7a0a49b88bd555c3fa5eb6b5'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'failure_mode'
                            value: 'delayed_response'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e03104ffddd744f39a284ade129c8180'
                        key: {
                            sys_security_acl: '4cf611f9f5de4b05976f87d42ac443bb'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e0b7881e488f4ae8bfd6ec028cc78ac3'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e0d5722e9bd8495fbf0768f167f5993a'
                        key: {
                            sys_security_acl: '99641f184ef048ac8fca75079cb31a01'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e0f7143f273a4eae943cbc48c629a2ff'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'bank_charge'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e10b222e137640d2953ad5ced4d5a112'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'alias_type'
                            value: 'bank_remitter_name'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e11c484fd00443338c83b40a1b04cfdc'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e1a3f69a1fb7486f8164c9cb28f96843'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'correlation_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                        key: {
                            name: 'x_695068_bcfa.finance_approver'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e1e46bdc6f654dcfa6d392b840b673d9'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'extraction_json'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'e23115dee7fe4d53b5b03660e2afcc40'
                        key: {
                            document_key: '0ed0fbb411da48efa9fa4608fc130842'
                            variable: '42f2564b73031300440211d8faf6a777'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e2589c707411408181d5bf24b9ea33cb'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'ai_recommendation'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'e272ae7667284ea7b44f80e7cd1b3228'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'document_type'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e2776671308a459481d872ece599a20e'
                        key: {
                            sys_security_acl: '4cb90e66103b475695e511079dd91a65'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e2b0ba8997614ce1b9839b0986920413'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'requested_at'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e2b4d59cd36d4be4afb9b75ed990f4c1'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e2d8573b01364ce08900cae4aca3e7ee'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'payment'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e2f1f2d567db4c8584bee6844efcb28b'
                        key: {
                            sys_security_acl: '3366e1b1b362415eb5ca04148fb4aab3'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e384bdda56fc46d8a5b17ff1f1709ae3'
                        key: {
                            sys_security_acl: '60f57bd780674e16b527c38a48cbc82e'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e3f353e6f5024044b5810706aafac9e9'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e44a552daa254607a8e11267aaf32cb0'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'mapping_type'
                            value: 'currency'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e455161d516b4b869a72296098bc307f'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'internal_reference_table'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e45f89378152452693e33b4a6e48a27b'
                        key: {
                            sys_security_acl: '1be52f29a4e24342b804bd5ff66ecb20'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e470ca7d6a6c4a549795162dfd9f87fa'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'company_code'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e4ab8ace5a354d80914a99ad1ba138ff'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                            value: 'extract_remittance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e4ec325ea83446bb92e04cc4d11221a7'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'claude_request_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e4f7b033236742129c45bce90ad07413'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'customer_candidate'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'e504dace15e8437f839d89cdb2038f7c'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e5196d07aa20497e8e771bd54fa32fb6'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e586dc89c0684b5dad2e5fffba32cce0'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                            value: 'explain_ar_exception'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_form_action'
                        id: 'e5b9785bbba24b2cbfb265e471c82392'
                        key: {
                            ui_action: 'bc2017ca30674afebde162cd93a9aaa6'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e5d38d86905c4f48871e308e78dd082c'
                        key: {
                            sys_security_acl: '4cf611f9f5de4b05976f87d42ac443bb'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e5e1ba74436343ab97cd0246ad08b564'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'approver'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e5e6dad65fe945b68f7f0202aa70dd3f'
                        key: {
                            sys_security_acl: '1be52f29a4e24342b804bd5ff66ecb20'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e60148d156844c0eb9db8a8fcaf93f95'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'request_payload'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e61ee9afc19d48af878b1dc5d926bebc'
                        key: {
                            name: 'x_695068_bcfa_audit_event'
                            element: 'actor_type'
                            value: 'user'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e656f12c183743dfbf5ea0c58aea6087'
                        key: {
                            name: 'x_695068_bcfa_payment_allocation'
                            element: 'ar_open_item'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e6dfe1072b7e445ca19cc72badd809e8'
                        key: {
                            sys_security_acl: '6f526450085c42bbaf2d25c61d0d4d2f'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e764f003b05c4eeb9b949c526eefa1cc'
                        key: {
                            sys_security_acl: '3cd32ab37fcb4ac0b26d66f71cc67b56'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e7970cdf9b3e45f38026dabd9ad55e33'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e7ed6a51f54040c089c291d3c47216a1'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'severity'
                            value: 'low'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'e8383760fd134492a390b6d96d8382b1'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e840322b6ddc416e9d19f522aa8d547a'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'company_code'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e850ff06654b4d9e83b1a68c5f76bdb5'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'currency'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e886d3b6c43f45cdaa74458aa7a9e149'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'payment'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e8fab1d18a9247f7b8ae03992acebdda'
                        key: {
                            sys_security_acl: '48658a85a5bd428b916c59a1e8fe5999'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'e91fdf7cbf4c48cfb723f22c34853420'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e952371aba5e4df88d78b39ec1b8f750'
                        key: {
                            sys_security_acl: 'a257264a9d9f49bf9db8760b2286c6aa'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e95ba64ee66246c5a6613d284b8b9764'
                        key: {
                            name: 'x_695068_bcfa_vendor'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e96e57bb757d44e78c5296f8db2fc163'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e971571490f642e5ba9b9a887e8a1190'
                        key: {
                            sys_security_acl: '632df7f0b6d246e49946a2cce8c2b8db'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e998353880eb47daa28dcc0d83d9345d'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'confidence'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e9ce0011727c4eeb89eee6ac0dcbea2d'
                        key: {
                            sys_security_acl: '9872a75472714b048f105785d5354527'
                            sys_user_role: {
                                id: '03604bf4100246588f4250676240bc18'
                                key: {
                                    name: 'x_695068_bcfa.auditor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e9fe233c75c741c7b2f1ff9d0345ed7d'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'resolution_notes'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'eabd7e58a1814a229a181ae6c8ddff3e'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'line_number'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'eaee9f17184c49b091715e9d0092945e'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'severity'
                            value: 'medium'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'eaf38015d8984a5eb1df0cd78dd1a200'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'adapter'
                            value: 'mock_archive'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'eb318fb1c8334843887eef583f813685'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'mode'
                            value: 'passthrough'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ebb7b2ee8d934fbbb65488f5c9cd5196'
                        key: {
                            sys_security_acl: 'c8f598159ed2462ebb324cc529b2874f'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ebe9b515caaf4733a6fab265eba8c82d'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'idempotency_key'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ebee197e91c1468891994f1b0312a86a'
                        key: {
                            name: 'x_695068_bcfa_finance_exception'
                            element: 'status'
                            value: 'open'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ebeeae72e3734ce3a3ff6de8a311d2b3'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'ar_open_item'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ec3ae3e092434cc28a4b90f79574803b'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                            value: 'connectivity_test'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ec8171b5aea740fd908c62519c45cbda'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'executed_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ecbed8f13f0943309ff2afb78262e34c'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'confidence'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ed0619e7921040fa8a2869a87c70cabf'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'description'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ed084142b6714bbca4499f10671c11c7'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'operation'
                            value: 'extract_invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ed38c73b59e44c7b846512b10a5ecf04'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'status'
                            value: 'timeout'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ed6193cc0df04d9bbe8ba5f19d976e3f'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'amount'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ed9ee86b0c3b4cd8b2c0379711731997'
                        key: {
                            sys_security_acl: '767651e4e78945b29b70c9fb458937db'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'edb6cdd9da2b4fb5843145bbd7c02e55'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'gross_amount'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'edd8f642970245e5a21e50b462150aa1'
                        key: {
                            sys_security_acl: 'd0945417b2614665ab0ded3deff07c5b'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ede458e476c2457d911f241a4ae33f7b'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'adapter'
                            value: 'mock_bank'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ee0456df3944447d8aeeedbdb309ab48'
                        key: {
                            sys_security_acl: '99641f184ef048ac8fca75079cb31a01'
                            sys_user_role: {
                                id: '03604bf4100246588f4250676240bc18'
                                key: {
                                    name: 'x_695068_bcfa.auditor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ee47593a3711452eb80d83f8e1da40fa'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'posting_state'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ee643935ed1a450eada1dee59662780f'
                        key: {
                            sys_security_acl: 'd32c1b8bcefd4b2894a3ce7ac8036ac2'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ee70a4c59cca40b9b5d36c491385024a'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'source'
                            value: 'manual'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ui_action_role'
                        id: 'eed66f90767f47d8a8c849faf82464b5'
                        key: {
                            sys_ui_action: '18b2ffb432d943449a162c7a1acfe9b3'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'eeeff1cf393542b28b836f946fa3d9b5'
                        key: {
                            sys_security_acl: '3a2f384a1f6244f68a801537a336a2a5'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ef134345896742b2b86bb5ab50480fd2'
                        key: {
                            name: 'x_695068_bcfa_reference_mapping'
                            element: 'mapping_type'
                            value: 'vendor'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'ef3e05b5b22f459f90d7e83561093758'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ef6e3f69ad2143a392b24fed1e511a01'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'requested_by'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ef8f2e75f6cb4cbdb5794cb3ad409d7a'
                        key: {
                            sys_security_acl: 'c6e115c751ff4bf38e92bd57c04c163b'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f04f979d44414b5392def6c015363e6a'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f0b283d0d3434dbc88640387b873c3de'
                        key: {
                            sys_security_acl: 'ece4c82447a34cafb17810d3af76a1e0'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f0ba2b19b8454e4aa7f6f5e125deb354'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'approver'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f0e78526d6ef4a839800e3b81a088f82'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'assigned_to'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f134f8744bab4f51bf157900633f6bdd'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'approval_state'
                            value: 'rejected'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f1e4604711d44669917421903ba53af3'
                        key: {
                            sys_security_acl: 'c4fe66868db849a68727cc00bd76381d'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f23ac172f6d44d0fbe38666dcfd604c8'
                        key: {
                            name: 'x_695068_bcfa_ap_match'
                            element: 'tax_variance'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f2b531ce2eaa4290914808990ff08e3c'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'deduction_type'
                            value: 'short_pay'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f2c38f7069934ff98a381d8f7ee6a60c'
                        key: {
                            sys_security_acl: '16b882b598174209b9f03740f909d8b6'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f2d08b0ff4844832b8e86a0a6dadd466'
                        key: {
                            name: 'x_695068_bcfa_customer_alias'
                            element: 'alias_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f2d6b3923add420a8ee3596c01bce991'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'requested_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f382892b71e8412dac0f07787ecd9294'
                        key: {
                            sys_security_acl: 'c8f598159ed2462ebb324cc529b2874f'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f38eac69e1444e2b84695262a21378fc'
                        key: {
                            name: 'x_695068_bcfa_remittance'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f390a52775954100bf2c3b505d87ec6a'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f3988eb073344ac094ff039b455ece2c'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'quantity'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f3a191285b584095903dfc8a89909d38'
                        key: {
                            sys_security_acl: 'dbe1a721f3a34d8b8578c5bd66ff82b3'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f3d848e051024026bb39c58fe3508a11'
                        key: {
                            name: 'x_695068_bcfa_receipt'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f45bffbe316d47dd9a3f0f0c3e43427b'
                        key: {
                            sys_security_acl: '9772832986ee4b3db736de1a9a377737'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f4b117e2ebba44c59e78385cb28fde3e'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'response_delay_ms'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f4bca37498e9406b92c6a5e0cca218bc'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'input_tokens'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f4dd8d62afce4c1faca63882bc64fa57'
                        key: {
                            sys_security_acl: '767651e4e78945b29b70c9fb458937db'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'f53a6c5b9ccc4097a0009a58800d29ac'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'f5690de1610a41efa84060fa47b96159'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'f5e6b1def1e84357a3f05b0b1074c7ea'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f5e88def0d634da0ae3a6183ccac5036'
                        key: {
                            name: 'x_695068_bcfa_ap_extraction'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f5f73cdf27d245e0a1517719f6cfefbb'
                        key: {
                            name: 'x_695068_bcfa_ar_open_item'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f61fe2fcb6ff4100aa6c2b967afc82b2'
                        key: {
                            sys_security_acl: 'e94b991c4b954494b225f3a86a9a7eb8'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f67dc2fefb80455bb76c7946ef0118d3'
                        key: {
                            name: 'x_695068_bcfa_ap_exception'
                            element: 'status'
                            value: 'in_review'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f68df56e65d54ef3a07a2c7a81eccd2f'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'status'
                            value: 'refused'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f6d60c103991461fb09c49493d7c3500'
                        key: {
                            sys_security_acl: '3cd32ab37fcb4ac0b26d66f71cc67b56'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f73db4cf63504c95ba278afeec31a5e7'
                        key: {
                            name: 'x_695068_bcfa_match_candidate'
                            element: 'match_type'
                            value: 'fuzzy'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f7af3dd20c8e4dd29248938f8e728cab'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'status'
                            value: 'proposed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'f7e264a34a3541e880703da51ae508f9'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f8087374d21e40ad9604bf839f4ef4a6'
                        key: {
                            sys_security_acl: '22c841fbf736425e9f5dc93fec3c7589'
                            sys_user_role: {
                                id: 'bf505b5092574a7fa59a01048550571a'
                                key: {
                                    name: 'x_695068_bcfa.ap_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f83ed73ed0274a6cb0422a9f5454de3e'
                        key: {
                            sys_security_acl: 'ee6e1403798f4fef8533f0abcecd1895'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f882346322c54128a7e6ce754222b576'
                        key: {
                            name: 'x_695068_bcfa_ar_approval'
                            element: 'decision'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f8937889573b4cbcbc119c6145f4aa39'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'ap_invoice'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'f89ffe10d83b4f9992ab42681521f9d2'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f8fdb6ddcc0743dcbb0ef338ea019a52'
                        key: {
                            name: 'x_695068_bcfa_customer'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f8ffe79e9f7b44ce914c9e8961b6403d'
                        key: {
                            sys_security_acl: '87c6a912c317412e9cc92697f62124c3'
                            sys_user_role: {
                                id: '484c56f4217841e298f5752ea6093a3f'
                                key: {
                                    name: 'x_695068_bcfa.finance_reviewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f96c8343c3164c73838b114f69a4360c'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'currency'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f98d38b14efe4c61a13bda39073c5e2a'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'remittance'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f99d62eb63c24bbd9d5deb73e0c633d3'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f9b7c16f7f8d42fd86048eebd813fc29'
                        key: {
                            name: 'x_695068_bcfa_decision_log'
                            element: 'result'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fa1b190fc91640c08c7922f61f7d83e6'
                        key: {
                            name: 'x_695068_bcfa_deduction'
                            element: 'credit_note'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'fa4f643424b94819a505c86eba694065'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'adapter'
                            value: 'mock_archive'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fa71482c38e64de7b87b9bf1bb63b965'
                        key: {
                            name: 'x_695068_bcfa_finance_intake'
                            element: 'source_reference'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'faabf8274d39455e98be873ba5da0779'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'failure_mode'
                            value: 'duplicate'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'fbe81045b7134d9eac2518c2031713b9'
                        key: {
                            sys_security_acl: 'd04d1fab72c048a1aa3da6db20c8db5e'
                            sys_user_role: {
                                id: '588d615a5fea475bbe3422f50e91c218'
                                key: {
                                    name: 'x_695068_bcfa.ar_processor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'fc15daa4de0d4395bcde3d8180f4d078'
                        key: {
                            name: 'x_695068_bcfa_integration_txn'
                            element: 'status'
                            value: 'success'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fc2b498fed434f65bd8b33a53b48c00e'
                        key: {
                            name: 'x_695068_bcfa_payment'
                            element: 'posting_date'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fc317d2922ea4f389f8a80f1653d81d4'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'receipt_reference'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'fc8ae49a3bd14e37b2950f5509436411'
                        key: {
                            sys_security_acl: '3cd32ab37fcb4ac0b26d66f71cc67b56'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fca56d4316114e16bbf83de8fe3fbe67'
                        key: {
                            name: 'x_695068_bcfa_ai_interaction'
                            element: 'source_record'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'fcc280f16b8844ddae9a3e28f27a76a8'
                        key: {
                            sys_security_acl: '2a4af0c45dbb4bee9f3d9e70f683ca81'
                            sys_user_role: {
                                id: '8409bca632a3430eb7a56387f244a74f'
                                key: {
                                    name: 'x_695068_bcfa.read_only'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fcf771afff87483e8cdc92bb1dc2431e'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'approval_state'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'fd8b5c0e8bfe4eef82ebfd10a5f491db'
                        key: {
                            name: 'x_695068_bcfa_ar_exception'
                            element: 'status'
                            value: 'closed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'fdc86a92aa9445168987126b184aa5fa'
                        key: {
                            sys_security_acl: 'd7fef0b814bf4ef9ac5cd0b78a84a3d7'
                            sys_user_role: {
                                id: '4411dd9103de4bdbb5468924b1e5459f'
                                key: {
                                    name: 'x_695068_bcfa.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fde0bd5fe627418595de4323b4e3b389'
                        key: {
                            name: 'x_695068_bcfa_integration_profile'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'fde6392321714ad1bcbe50b47c2f9e8d'
                        key: {
                            sys_security_acl: 'ee6e1403798f4fef8533f0abcecd1895'
                            sys_user_role: {
                                id: 'e1abbc605ba34cbfb77c584ea689c1b2'
                                key: {
                                    name: 'x_695068_bcfa.finance_approver'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'fe3a2f8e942a4802a7c622276d16d081'
                        key: {
                            name: 'x_695068_bcfa_ap_approval'
                            element: 'decision'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'fe52a32155e949a2b981478778ed06c2'
                        key: {
                            sys_security_acl: 'c6e115c751ff4bf38e92bd57c04c163b'
                            sys_user_role: {
                                id: '0c4ec58b4b8d4effa699694222685cfd'
                                key: {
                                    name: 'x_695068_bcfa.integration_operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ff3e7693defc4a25aadd8ef8a15d9688'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice_line'
                            element: 'po_line'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ff5cad95fce149a49b7105db4645b220'
                        key: {
                            name: 'x_695068_bcfa_ap_invoice'
                            element: 'posting_state'
                            value: 'posting'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_form_action'
                        id: 'ffda0ddd70c14e0fa4a15bc99f9e3110'
                        key: {
                            ui_action: 'aa49bcfe92ea415bab51ed26ca7b3d9f'
                        }
                    },
                ]
            }
        }
    }
}
