/**
 * Email Templates Index
 * Exporta todos los templates de email para fácil importación
 */

module.exports = {
    welcome: require('./welcome-email'),
    orderConfirmation: require('./order-confirmation'),
    adminNotification: require('./admin-notification'),
    paymentConfirmed: require('./payment-confirmed')
};
