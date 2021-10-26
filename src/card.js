module.exports = function cardModule(now) {
    function card(card_id) {
        let events = [];
        let limit;
        let used = 0;

        // invariant
        function limitAlreadyAssigned() {
            return limit != null;
        }

        function notEnoughMoney(amount) {
            return amount > availableLimit();
        }

        function availableLimit() {
            return limit - used;
        }

        function apply(event) {
            if (event.type === 'LIMIT_ASSIGNED') {
                limit = event.amount;
            }
            if (event.type === 'CARD_WITHDRAWN') {
                used += event.amount;
            }
            if (event.type === 'CARD_REPAID') {
                used -= event.amount;
            }
        }

        return {
            apply,
            assignLimit(amount) {
                // business invariant/rule
                if (limitAlreadyAssigned()) {
                    throw new Error('Cannot assign limit for the second time');
                }
                events.push({type: 'LIMIT_ASSIGNED', amount, card_id, date: now().toJSON()});
                limit = amount;
            },
            availableLimit,
            withdraw(amount) {
                if (!limitAlreadyAssigned()) {
                    throw new Error('No limit assigned');
                }
                if (notEnoughMoney(amount)) {
                    throw new Error('Not enough money');
                }
                events.push({type: 'CARD_WITHDRAWN', amount, card_id, date: now().toJSON()});
                used += amount;
            },
            repay(amount) {
                events.push({type: 'CARD_REPAID', amount, card_id, date: now().toJSON()});
                used -= amount;
            },
            pendingEvents() {
                return events;
            },
            uuid() {
                return card_id;
            },
        };
    }

    function recreateFrom(card_id, events) {
        return events.reduce((card, event) => {
            card.apply(event);
            return card;
        }, card(card_id));
    }

    return {card, recreateFrom};
};