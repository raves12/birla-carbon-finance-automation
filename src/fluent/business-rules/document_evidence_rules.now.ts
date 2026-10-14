import { BusinessRule } from '@servicenow/sdk/core'

// Phase 42: Document Evidence Review rows (human stamp / GRN decisions).

export const documentEvidenceReviewCapture = BusinessRule({
    $id: Now.ID['br-document-evidence-review-capture'],
    name: 'Document Evidence Review - Capture',
    table: 'x_695068_bcfa_document_evidence_review',
    when: 'before',
    action: ['insert'],
    order: 100,
    active: true,
    description: 'Sets reviewer, time and the AI / OCR value (never typed by the reviewer); stamp decisions must be yes or no and carry a reason.',
    script: Now.include('../../server/business-rules/DocumentEvidenceReviewCapture.server.js'),
})

export const documentEvidenceReviewApply = BusinessRule({
    $id: Now.ID['br-document-evidence-review-apply'],
    name: 'Document Evidence Review - Apply',
    table: 'x_695068_bcfa_document_evidence_review',
    when: 'after',
    action: ['insert'],
    order: 100,
    active: true,
    description: 'Applies the decision to the AP invoice (stamp present, human confirmed / rejected) or the GRN evidence (re-compared with SAP), and writes a Human Review audit event.',
    script: Now.include('../../server/business-rules/DocumentEvidenceReviewApply.server.js'),
})

export const documentEvidenceReviewAppendOnly = BusinessRule({
    $id: Now.ID['br-document-evidence-review-append-only'],
    name: 'Document Evidence Review - Append Only',
    table: 'x_695068_bcfa_document_evidence_review',
    when: 'before',
    action: ['update', 'delete'],
    order: 10,
    active: true,
    description: 'Evidence decisions are append-only: updates and deletes are rejected.',
    script: Now.include('../../server/business-rules/DocumentEvidenceReviewAppendOnly.server.js'),
})
