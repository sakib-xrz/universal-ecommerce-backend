const { v4: uuidv4 } = require('uuid');

function generateOrderId() {
    const uuid = uuidv4();
    const alphanumeric = uuid.replace(/[^a-z0-9]/gi, '');
    return alphanumeric.substring(0, 6).toUpperCase();
}

module.exports = generateOrderId;
