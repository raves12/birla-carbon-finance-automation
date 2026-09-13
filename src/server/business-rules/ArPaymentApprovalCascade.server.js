if (current.getValue('state') === 'APPROVED' && previous.getValue('state') !== 'APPROVED') {
    var svc = new ArDomainService();
    svc.clearPayment(current.getUniqueValue());
}
