const ClientError = require("./clientError");

const LIMIT_ASSIGNED = 'LIMIT_ASSIGNED';
const CARD_WITHDRAWN = 'CARD_WITHDRAWN';
const CARD_REPAID = 'CARD_REPAID';

// favor composition over inheritance
function eventTracker(apply) {
    let events = [];

    return {
        applyWithRecord(event) {
            events.push(event);
            return apply(event);
        },
        pendingEvents() {
            return events;
        },
        flushEvents() {
            events = [];
        }
    };
}

module.exports = function cardModule(now) {
    function card(card_id) {
        let {applyWithRecord, ...tracker} = eventTracker(apply);
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
            if (event.type === LIMIT_ASSIGNED) {
                limit = event.amount;
            }
            if (event.type === CARD_WITHDRAWN) {
                used += event.amount;
            }
            if (event.type === CARD_REPAID) {
                used -= event.amount;
            }
        }


        return {
            ...tracker,
            apply,
            assignLimit(amount) {
                // business invariant/rule
                if (limitAlreadyAssigned()) {
                    throw new ClientError('Cannot assign limit for the second time');
                }
                applyWithRecord({type: LIMIT_ASSIGNED, amount, card_id, date: now().toJSON()});
            },
            availableLimit,
            withdraw(amount) {
                if (!limitAlreadyAssigned()) {
                    throw new ClientError('No limit assigned');
                }
                if (notEnoughMoney(amount)) {
                    throw new ClientError('Not enough money');
                }
                applyWithRecord({type: CARD_WITHDRAWN, amount, card_id, date: now().toJSON()});
            },
            repay(amount) {
                applyWithRecord({type: CARD_REPAID, amount, card_id, date: now().toJSON()});
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