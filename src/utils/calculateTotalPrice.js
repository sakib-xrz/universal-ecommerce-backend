const { DiscountType } = require('@prisma/client');

function calculateTotalPrice(
    sellPrice,
    quantity,
    discount,
    discountType
) {
    if (discount > 0) {
        if (discountType === DiscountType.PERCENTAGE) {
            return sellPrice * quantity * (1 - discount / 100);
        } else if (discountType === DiscountType.FLAT) {
            return sellPrice * quantity - discount;
        }
    }
    return sellPrice * quantity;
}

module.exports = calculateTotalPrice;
