module.exports = function cardRepositoryFactory(recreateFrom) {
    const storage = {};

    return {
        async save(card) {
            const oldEvents = storage[card.uuid()] || [];
            const allEvents = [...oldEvents, ...card.pendingEvents()];
            card.flushEvents();
            storage[card.uuid()] = allEvents;
        },
        async load(uuid) {
            return recreateFrom(uuid, storage[uuid] || []);
        }
    };
}