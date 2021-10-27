function initStore(config = {
    type: 'mongodb',
    host: 'localhost',
    port: 27017,
    dbName: 'card_eventstore_new',
    eventsCollectionName: 'events',
    snapshotsCollectionName: 'snapshots',
    transactionsCollectionName: 'transactions',
    timeout: 10000,
    options: {
        useNewUrlParser: true
    }
}) {
    const es = require('eventstore')(config);
    //  declaration merging

    // ACL - anti corruption layer
    es.close = function() {
        return es.store.db && es.store.db.close();
    }

    es.useEventPublisher(function(evt, callback) {
        console.log('emitting event', evt);
        callback();
    });

    return new Promise(function(resolve, reject) {
        es.init(function (err) {
            if(err) reject(err);
            resolve(es);
        });
    });
}

module.exports = initStore;