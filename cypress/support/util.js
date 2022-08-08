// orderListValue: Split and replace orderListValue to return value of condition
// e.g. orderListValue = 'visitPage[Dresses]' => 'Dresses'
export const covertOrderListValueCondition = (orderListValue) => {
// function covertOrderListValueCondition(orderListValue) {
    return orderListValue.split('[').pop().replace(']', '');
}
    