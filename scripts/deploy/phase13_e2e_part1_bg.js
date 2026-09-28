// Phase 13 end-to-end test, part 1 of 2. Run in Scripts - Background with
// scope = x_695068_bcfa (the app scope, NOT global), after
// phase13_cash_journey_bg.js has been deployed.
//
// 1. Seeds the POC 2 data (DemoDataSeeder.seedPoc2CashScenarios): three
//    fictional customers, their open items, and three bank statement
//    payments waiting in RECEIVED.
// 2. "Uploads" the three remittance PDFs (test/fixtures/AR_REMIT_10x) as
//    Finance Intake records, as the workspace upload does.
// 3. Processes each document exactly as the "Process Document" button does:
//    A  AR_REMIT_101_EXACT          50,000 -> ARINV1001 -> approval -> clearing -> CLOSED
//    B  AR_REMIT_102_MULTI_INVOICE  80,000 -> ARINV2001 + ARINV2002 (+ AI explanation)
//                                   -> approval -> clearing -> CLOSED
//    C  AR_REMIT_103_BANK_CHARGE    79,500 vs 80,000 -> short_pay exception
//                                   (decided in part 2, after the AI review)
// Re-running is safe: existing records are reused, processed documents are
// reported, not processed twice.
var DEMO_APPROVER = 'd33f6290d7533660937e25a599602b2c'; // bcfa.finance.approver
var DOCS = {
    A: { file: 'AR_REMIT_101_EXACT.pdf', base64: 'JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUiAvRjMgNCAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YxIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKMyAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYS1Cb2xkIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMiAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EtT2JsaXF1ZSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjMgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iago1IDAgb2JqCjw8Ci9Db250ZW50cyA5IDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1LjI3NTYgODQxLjg4OTggXSAvUGFyZW50IDggMCBSIC9SZXNvdXJjZXMgPDwKL0ZvbnQgMSAwIFIgL1Byb2NTZXQgWyAvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJIF0KPj4gL1JvdGF0ZSAwIC9UcmFucyA8PAoKPj4gCiAgL1R5cGUgL1BhZ2UKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL1BhZ2VNb2RlIC9Vc2VOb25lIC9QYWdlcyA4IDAgUiAvVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKNyAwIG9iago8PAovQXV0aG9yIChhbm9ueW1vdXMpIC9DcmVhdGlvbkRhdGUgKEQ6MjAyNjA5MjgxMjQ4MzQrMDUnMDAnKSAvQ3JlYXRvciAoYW5vbnltb3VzKSAvS2V5d29yZHMgKCkgL01vZERhdGUgKEQ6MjAyNjA5MjgxMjQ4MzQrMDUnMDAnKSAvUHJvZHVjZXIgKFJlcG9ydExhYiBQREYgTGlicmFyeSAtIFwob3BlbnNvdXJjZVwpKSAKICAvU3ViamVjdCAodW5zcGVjaWZpZWQpIC9UaXRsZSAodW50aXRsZWQpIC9UcmFwcGVkIC9GYWxzZQo+PgplbmRvYmoKOCAwIG9iago8PAovQ291bnQgMSAvS2lkcyBbIDUgMCBSIF0gL1R5cGUgL1BhZ2VzCj4+CmVuZG9iago5IDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDY0NAo+PgpzdHJlYW0KR2F0PWg/I1EyZCdTYylKLylKSVg+JFRnMCJFcnI+V2hDXk0mWywtMGdwImBdPTlDc0U8OHVlMkpMJWJtKDAoPmlQMG5RIkktYm5rLW4mMVJYdGpCOUVXPGhpMzkxOmYsVVZSZF4pVCEkKjZeRmdGJTVNNl4oIlprOzwkNGRba1AqKUU/KlNdYl0nbVpJYjJdUTlIaV8iaUZjJCVsbk8hbDBXaXA4T0ZKREFGTS08KWVnQVsiNDxKX0BmVWk9Rk1VOnI8LUJFYEBycllrNC4pMUFAPyknY0lQUGJUaGc4SXAyLytyUXVPQmhtLWVlNmpAN0pNOWpPJCNWJVBrRlZlPVdNQ09lPSJIMDlUbEVaU1c7YHBnSSg2OVxfVScrZFdXTWlQZktUTTRnZkIyJkI9WnIkcy01KVxxVmJebEtHJGA+JkchdThib0YuMGk7J1NZSzFsWT89Uzc6cCphLyVwOVdqYVdQZzhaWCVLSztaSnBzSTRmcmo5JkI6czwoSjYtTTw1VDwucCpsVT1IIlVWSVZmUTlNIy1nalNKVEklX1MlQV49bkxnRnVZcjsySUYqM11FWzdGQiFYL2leZjNzUV9NQmMxaUBnTyk5UUcyJCFcRDt1SSQwMzdGPDxqbTFtNmxebEBscEZkJVsqYU8qUWRqJGtKRDJMIVgiRE9OWy5cSUFrSW1tcVhrRyFfVjxUN1sxcm5hX2glRyxAKj11ZyZZS09RNFMxPXIqMTFHPVpKUCJWaXIiUjpsXidtK1RgLCVYMTBiSTtrYW5aMlE7Mmc+ck1zZEZWT1NIKk0mVlxdM3AwL0EqI2ZPSEU2SDEzUyNZdFklVzswbGsoSmNsL2JRfj5lbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAxMAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwNjEgMDAwMDAgbiAKMDAwMDAwMDExMiAwMDAwMCBuIAowMDAwMDAwMjE5IDAwMDAwIG4gCjAwMDAwMDAzMzEgMDAwMDAgbiAKMDAwMDAwMDQ0NiAwMDAwMCBuIAowMDAwMDAwNjQ5IDAwMDAwIG4gCjAwMDAwMDA3MTcgMDAwMDAgbiAKMDAwMDAwMDk3OCAwMDAwMCBuIAowMDAwMDAxMDM3IDAwMDAwIG4gCnRyYWlsZXIKPDwKL0lEIApbPGM4OTUzNTg5ZjUxMzAxMzVmMzc5ZjViODczOWZjZTc4PjxjODk1MzU4OWY1MTMwMTM1ZjM3OWY1Yjg3MzlmY2U3OD5dCiUgUmVwb3J0TGFiIGdlbmVyYXRlZCBQREYgZG9jdW1lbnQgLS0gZGlnZXN0IChvcGVuc291cmNlKQoKL0luZm8gNyAwIFIKL1Jvb3QgNiAwIFIKL1NpemUgMTAKPj4Kc3RhcnR4cmVmCjE3NzEKJSVFT0YK' },
    B: { file: 'AR_REMIT_102_MULTI_INVOICE.pdf', base64: 'JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUiAvRjMgNCAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YxIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKMyAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYS1Cb2xkIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMiAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EtT2JsaXF1ZSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjMgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iago1IDAgb2JqCjw8Ci9Db250ZW50cyA5IDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1LjI3NTYgODQxLjg4OTggXSAvUGFyZW50IDggMCBSIC9SZXNvdXJjZXMgPDwKL0ZvbnQgMSAwIFIgL1Byb2NTZXQgWyAvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJIF0KPj4gL1JvdGF0ZSAwIC9UcmFucyA8PAoKPj4gCiAgL1R5cGUgL1BhZ2UKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL1BhZ2VNb2RlIC9Vc2VOb25lIC9QYWdlcyA4IDAgUiAvVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKNyAwIG9iago8PAovQXV0aG9yIChhbm9ueW1vdXMpIC9DcmVhdGlvbkRhdGUgKEQ6MjAyNjA5MjgxMjQ4MzQrMDUnMDAnKSAvQ3JlYXRvciAoYW5vbnltb3VzKSAvS2V5d29yZHMgKCkgL01vZERhdGUgKEQ6MjAyNjA5MjgxMjQ4MzQrMDUnMDAnKSAvUHJvZHVjZXIgKFJlcG9ydExhYiBQREYgTGlicmFyeSAtIFwob3BlbnNvdXJjZVwpKSAKICAvU3ViamVjdCAodW5zcGVjaWZpZWQpIC9UaXRsZSAodW50aXRsZWQpIC9UcmFwcGVkIC9GYWxzZQo+PgplbmRvYmoKOCAwIG9iago8PAovQ291bnQgMSAvS2lkcyBbIDUgMCBSIF0gL1R5cGUgL1BhZ2VzCj4+CmVuZG9iago5IDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDY3Mgo+PgpzdHJlYW0KR2F0PWg/I1FIJidTYylUKCU1X2dYPmkiYCNeXEtTQiN1TT5TOEhdbSlhP2cwWHBnJW8ydWBbYEAqPm9tQ11iNT5MN0lGVGNeP1NFSnEvQyZtbkYiRiI5b01IYXJrbCNRPTMnUSZWc2MsYzlVMyNTUGQ6PWY6LTAqK1lkNkJANWBpdTItZWFTK1lxaEFsIV4yIi4/YC8rL0lWPyFHMEVgc3FpIzciXW5jQGxuWSNLVT4xWUxhPkM4PkZxKzM3SkwjQSg4SjwoZD41SV5iQDIzY29eM2hHIks3az02O007NjM+V2Y/clUmUC1nPykvWTBPSjM8XF1UPnMuXSc+aD9WKXFsbF1eLGZuKVBvLV5JWTNwQk8sTCNCY1lLcl9WZW5mMV5yKTZILW1HLSpUTlhEUFdSaWcsLjk5akI8bnJAbThkTzZbVy8sNi9TU0xdWTFRSWk3TztKLlFMN1IhTmhxZWc7PkcjZjZEVi5EKmJpKXRNLEFPaz81MG9RYVRqO1Q4XCtATypiJSpfYDtIYEQzdV05Zzc5Q3QjVT9QQ2JNJyciYG8/NzxLRkQwQj9gWWRRSD9CSEhGV3FDc1VaL2pCZEk1cFFFUC5pMi5SUmE1XD4ucVVoYHVhST1eVi0hLSxYQTM6MG43bipkX2JgKlpDKCJMI3JlPm0+TXBWLlhEOU1IJXRlQkk1bks4Qm88OjcwZlZRbzxLVEhgU0tRUU8wdD4/WSM7ITRqKE4ibnRUL1RScipJMG9PYClPOnBbYWleMjR0SWQmMk84JVdibFdVZkxlYTdILWZbNjY/UyFSbmotRlxfcFJGMlQtazkwRmheYjVRaElHP10rbygxanMtPDdCbGhfJyhAPjxfUDc7LzcyU09gNVA0cFUwZ0xaI34+ZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgMTAKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDYxIDAwMDAwIG4gCjAwMDAwMDAxMTIgMDAwMDAgbiAKMDAwMDAwMDIxOSAwMDAwMCBuIAowMDAwMDAwMzMxIDAwMDAwIG4gCjAwMDAwMDA0NDYgMDAwMDAgbiAKMDAwMDAwMDY0OSAwMDAwMCBuIAowMDAwMDAwNzE3IDAwMDAwIG4gCjAwMDAwMDA5NzggMDAwMDAgbiAKMDAwMDAwMTAzNyAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9JRCAKWzwyOGIwMmVlZDMzODYwZTQzNjNmYmJmYmU0MDRiYjllZj48MjhiMDJlZWQzMzg2MGU0MzYzZmJiZmJlNDA0YmI5ZWY+XQolIFJlcG9ydExhYiBnZW5lcmF0ZWQgUERGIGRvY3VtZW50IC0tIGRpZ2VzdCAob3BlbnNvdXJjZSkKCi9JbmZvIDcgMCBSCi9Sb290IDYgMCBSCi9TaXplIDEwCj4+CnN0YXJ0eHJlZgoxNzk5CiUlRU9GCg==' },
    C: { file: 'AR_REMIT_103_BANK_CHARGE.pdf', base64: 'JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUiAvRjMgNCAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YxIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKMyAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYS1Cb2xkIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMiAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EtT2JsaXF1ZSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjMgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iago1IDAgb2JqCjw8Ci9Db250ZW50cyA5IDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1LjI3NTYgODQxLjg4OTggXSAvUGFyZW50IDggMCBSIC9SZXNvdXJjZXMgPDwKL0ZvbnQgMSAwIFIgL1Byb2NTZXQgWyAvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJIF0KPj4gL1JvdGF0ZSAwIC9UcmFucyA8PAoKPj4gCiAgL1R5cGUgL1BhZ2UKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL1BhZ2VNb2RlIC9Vc2VOb25lIC9QYWdlcyA4IDAgUiAvVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKNyAwIG9iago8PAovQXV0aG9yIChhbm9ueW1vdXMpIC9DcmVhdGlvbkRhdGUgKEQ6MjAyNjA5MjgxMjQ4MzQrMDUnMDAnKSAvQ3JlYXRvciAoYW5vbnltb3VzKSAvS2V5d29yZHMgKCkgL01vZERhdGUgKEQ6MjAyNjA5MjgxMjQ4MzQrMDUnMDAnKSAvUHJvZHVjZXIgKFJlcG9ydExhYiBQREYgTGlicmFyeSAtIFwob3BlbnNvdXJjZVwpKSAKICAvU3ViamVjdCAodW5zcGVjaWZpZWQpIC9UaXRsZSAodW50aXRsZWQpIC9UcmFwcGVkIC9GYWxzZQo+PgplbmRvYmoKOCAwIG9iago8PAovQ291bnQgMSAvS2lkcyBbIDUgMCBSIF0gL1R5cGUgL1BhZ2VzCj4+CmVuZG9iago5IDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDcwMAo+PgpzdHJlYW0KR2F0PWg/I1FIJidTYylUKCU3dTkuXC5HQEtZOD1lQiN1TT5TOEhdbSlsZlpFPTI0ZW9uX1o5dVFEbl87IXRcIlhTRUUiVTMjaTgsIW51RnIuNTJDRUoiV0dDQExbJ2MjL2dZOWtWX1o3ZT83Q0BlWjxybShlY1kwUlZjM09gNmI8S0QqJ1hETVouK0tYXjJKbF1QVW5TR3ErXmJaZSNQSkMzOVhLJilwV2QpYmpAK1pgaGQwWWJha0hlLypdQVhwNy4+b05nbm4tdSNAQCRJV3RlKC0uOFlzK29gPigsQis6P15GJCgiaiNuaUdRSG1BVD48KCNmbWpYSVMpO1MvRU81RyViLGlIPlkuRT5kMyhCOG0rTzVMP2g6LC1bQ1VqODkwJiEib1FBWTZjVzEvazlXMjMqZSY6JGJkUHIpKmpEJSY/VVQoPEEjUkhBSltGO0pRcC9HXlRYZClBXjw+R2g8SU9cQ3Q9T3Q2I1loZSxxWkNSKylnJlZlVCU4VmZpbEskdFFzPTBfIiRYYzclZXFTRnEvYnFzTUxgX100LURnTjJrPV9yUGsycmRTUTwwUVorOlI4PGJZPEhqbCozQG5tRDB1VVFlY1U8L2dFb2Y9KWcpXjtcIloqbVpCUV1yT1dRXk5LW0IxKGU9YUNPLUZrQGY3SyMhMmlJJnFqXjw8QVhlXy9VTic0VEE4ZjtQJi5aTiskUXE3NjxDMykoXj9lT2FMUkFJYjVmPmIlOiYvJ0c0aUZcOT9rTWFFYEE0QnBAUmtJRFhzYkVvYGthQVBxdWJEJkxacUtSTHU5bG46MSZ1bypZWj0vajdCKVdMI2hrJz1DYmtaPz1uTScqV0EmNmUvJXExLXIyXCM1MDJdKTZOcENJT21WclBCMyddPWQwNShTTjcwXiNWLl9hKmBabWdcPjRRUnJ+PmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDEwCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA2MSAwMDAwMCBuIAowMDAwMDAwMTEyIDAwMDAwIG4gCjAwMDAwMDAyMTkgMDAwMDAgbiAKMDAwMDAwMDMzMSAwMDAwMCBuIAowMDAwMDAwNDQ2IDAwMDAwIG4gCjAwMDAwMDA2NDkgMDAwMDAgbiAKMDAwMDAwMDcxNyAwMDAwMCBuIAowMDAwMDAwOTc4IDAwMDAwIG4gCjAwMDAwMDEwMzcgMDAwMDAgbiAKdHJhaWxlcgo8PAovSUQgCls8YTEyNTc3N2M4OTg1Y2FmYTQyMzljODkwNjM3MjAyYjA+PGExMjU3NzdjODk4NWNhZmE0MjM5Yzg5MDYzNzIwMmIwPl0KJSBSZXBvcnRMYWIgZ2VuZXJhdGVkIFBERiBkb2N1bWVudCAtLSBkaWdlc3QgKG9wZW5zb3VyY2UpCgovSW5mbyA3IDAgUgovUm9vdCA2IDAgUgovU2l6ZSAxMAo+PgpzdGFydHhyZWYKMTgyNwolJUVPRgo=' }
};
var out = [];

function paymentLine(id) {
    var p = new GlideRecord('x_695068_bcfa_payment');
    if (!p.get(id)) return 'payment not found';
    return p.getValue('bank_reference') + ' ' + p.getValue('amount') + ' ' + p.getValue('currency') + ' state=' + p.getValue('state') +
        ' customer=' + p.getDisplayValue('customer');
}

function allocationLines(id) {
    var a = new GlideRecord('x_695068_bcfa_payment_allocation');
    a.addQuery('payment', id);
    a.orderBy('sys_created_on');
    a.query();
    var lines = [];
    while (a.next()) lines.push(a.getDisplayValue('ar_open_item') + ':' + a.getValue('allocated_amount') + ':' + a.getValue('allocation_state'));
    return 'allocations [' + lines.join(', ') + ']';
}

function openItems(numbers) {
    var i = new GlideRecord('x_695068_bcfa_ar_open_item');
    i.addQuery('item_number', 'IN', numbers.join(','));
    i.orderBy('item_number');
    i.query();
    var lines = [];
    while (i.next()) lines.push(i.getValue('item_number') + ' open=' + i.getValue('open_amount') + ' ' + i.getValue('status'));
    return 'open items [' + lines.join(', ') + ']';
}

function clearingLine(id) {
    var t = new GlideRecord('x_695068_bcfa_integration_txn');
    t.addQuery('source_record', id);
    t.orderBy('sys_created_on');
    t.query();
    var lines = [];
    while (t.next()) lines.push(t.getValue('operation') + ':' + t.getValue('status') + (t.getValue('external_document_id') ? ':' + t.getValue('external_document_id') : ''));
    return 'integration [' + lines.join(', ') + ']';
}

function intakeFor(doc) {
    var intake = new GlideRecord('x_695068_bcfa_finance_intake');
    intake.addQuery('source_reference', doc.file);
    intake.query();
    if (intake.next()) return intake;
    intake.initialize();
    intake.setValue('source', 'workspace_upload');
    intake.setValue('source_reference', doc.file);
    intake.setValue('document_type', 'ar_remittance');
    intake.setValue('processing_status', 'new');
    intake.insert();
    new GlideSysAttachment().writeBase64(intake, doc.file, 'application/pdf', doc.base64);
    return intake;
}

try {
    var seeded = new DemoDataSeeder().seedPoc2CashScenarios();
    out.push('seed created: ' + (seeded.created.length ? seeded.created.join(', ') : 'nothing (already present)'));
    out.push('provider=' + new FinancePolicy().aiProvider() + ' auto_confidence=' + new FinancePolicy().arAutoMatchConfidence() +
        ' deduction_threshold=' + new FinancePolicy().arDeductionApprovalThreshold());

    var fdi = new FinanceDocumentIntakeService();
    var ar = new ArDomainService();
    ['A', 'B', 'C'].forEach(function(key) {
        var intake = intakeFor(DOCS[key]);
        if (intake.getValue('processing_status') !== 'new') {
            out.push(key + ' ' + intake.getValue('number') + ' already ' + intake.getValue('processing_status') +
                (intake.getValue('payment') ? ' -> ' + paymentLine(intake.getValue('payment')) : ''));
            return;
        }
        var r = fdi.processDocument(intake.getUniqueValue());
        var line = key + ' ' + intake.getValue('number') + ' stoppedAt=' + r.stoppedAt;
        if (!r.paymentSysId) {
            out.push(line + ' ' + JSON.stringify(r));
            return;
        }
        line += ' | ' + paymentLine(r.paymentSysId) + ' | ' + allocationLines(r.paymentSysId);
        if (r.allocation && r.allocation.candidateType) line += ' match=' + r.allocation.candidateType;

        if (r.stoppedAt === 'PENDING_APPROVAL') {
            var approvalId = r.detail.approvalSysId;
            var self = ar.decideApproval(r.paymentSysId, approvalId, 'approved', gs.getUserID(), 'Phase 13 E2E: self-approval attempt');
            line += ' | self-approval ' + (self.error ? 'BLOCKED' : 'NOT BLOCKED (defect)');
            var p = new GlideRecord('x_695068_bcfa_payment');
            p.get(r.paymentSysId);
            if (p.getValue('ai_recommendation')) {
                line += ' | AI match explanation ' + p.getValue('ai_recommendation').length + ' chars: "' +
                    p.getValue('ai_recommendation').substring(0, 160).replace(/\n/g, ' ') + '"';
            }
            var approved = ar.decideApproval(r.paymentSysId, approvalId, 'approved', DEMO_APPROVER, 'Phase 13 E2E: allocation confirmed by the demo finance approver.');
            line += ' | approval ' + (approved.error ? 'ERROR ' + approved.error : 'ok') + ' -> ' + paymentLine(r.paymentSysId) +
                ' | ' + allocationLines(r.paymentSysId) + ' | ' + clearingLine(r.paymentSysId);
        }
        if (r.detail && r.detail.exceptionSysId) {
            var e = new GlideRecord('x_695068_bcfa_ar_exception');
            e.get(r.detail.exceptionSysId);
            line += ' | exception=' + e.getUniqueValue() + ' reason=' + e.getValue('reason_code') + ' severity=' + e.getValue('severity') +
                ' sla_due=' + e.getValue('sla_due') + ' group=' + e.getDisplayValue('assignment_group') + ' owner=' + e.getDisplayValue('assigned_to') +
                ' residual=' + e.getValue('residual_amount') + ' rule=' + e.getValue('rule_result') + ' | evidence=' + (e.getValue('evidence') || '').replace(/\n/g, ' / ');
        }
        out.push(line);
    });
    out.push(openItems(['ARINV1001', 'ARINV2001', 'ARINV2002', 'ARINV3001', 'ARINV3002']));
} catch (err) {
    out.push('ERROR ' + err);
}
gs.info('BCFA_E2E13A ' + out.join('\n'));
