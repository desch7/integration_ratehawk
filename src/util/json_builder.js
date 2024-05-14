//Construction du json pour l'importation
const buildJsonForImportation = (datas) => {
    let importJson = []
    datas.map((item) => {
        let transType = item.invoice_id ? 'sales' : 'refund'
        let pubFare = Number((parseFloat(item.amount_sell_b2b2c.amount) / (item.nights + item.rooms_data.length)).toFixed(2))
        let negoFare = Number((parseFloat(item.amount_sell.amount) / (item.nights + item.rooms_data.length)).toFixed(2))
        let nbrAdults = item.rooms_data.reduce((acc, curr) => acc + curr.guest_data.adults_number, 0)
        let nbrchildren = item.rooms_data.reduce((acc, curr) => acc + curr.guest_data.children_number, 0)
        let mkp = Number(((parseFloat(item.amount_sell_b2b2c.amount) - parseFloat(item.amount_payable.amount))).toFixed(2))
        let orderBooking = {
            //line: Number(item.supplier_data.confirmation_id),
            line: Number(item.partner_data.order_id),
            traveler_name: item.rooms_data[0].guest_data.guests[0].first_name + ' ' + item.rooms_data[0].guest_data.guests[0].last_name,
            channel: "non_gds",
            transaction_type: transType,
            adj_type: "",
            adjusted_transaction: "",
            issuing_date: item.created_at,
            product_type: "hotel",
            pnr: String(item.partner_data.order_id),
            published_fare: pubFare,
            penality: 0,
            commission_rate: 0,
            fop: "nonref",
            loyalty_card: "",
            id_currency: item.amount_payable.currency_code,
            currency_rate: 1,
            selling_rate: 1,
            id_agent_sign: "INTEG",
            description: "",
            confirmation_number: item.supplier_data.confirmation_id,
            adj_number: "",
            customer_account: "",
            supplier_account: "",
            billing_mode: "bill",
            hotel_name: item.hotel_data.id,
            address: "",
            check_in: item.checkin_at,
            check_out: item.checkout_at,
            room_type: "Other",
            number_of_room: item.rooms_data.length,
            negotiated_fare: negoFare,
            adult: nbrAdults,
            children: nbrchildren,
            markup: mkp
        }
        orderBooking["#"] = "0"
        importJson.push(orderBooking)
    })
    return importJson
}

module.exports = buildJsonForImportation;