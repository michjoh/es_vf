function initStore() {
    const es = require('eventstore')({
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
    });
    //  declaration merging

    // ACL - anti corruption layer
    es.close = function() {
        return es.store.db.close();
    }

    return new Promise(function(resolve, reject) {
        es.init(function (err) {
            if(err) reject(err);
            resolve(es);
        });
    });
}

module.exports = initStore;