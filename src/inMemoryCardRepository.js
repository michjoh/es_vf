module.exports = function cardRepositoryFactory(recreateFrom) {
    const storage = {};

    return {
        async save(card) {
            const oldEvents = storage[card.uuid()] || [];
            const allEvents = [...oldEvents, ...card.pendingEvents()];
            storage[card.uuid()] = allEvents;
            card.flushEvents();
        },
        async load(uuid) {
            return recreateFrom(uuid, storage[uuid] || []);
        }
    };
}