const express = require('express');
const now  = function() { return new Date(); };
const {card, recreateFrom} = require('./card')(now);
const ClientError = require('./clientError');

module.exports = function(es) {
    const app = express();

    const repository = require('./cardRepository')(recreateFrom, es);

    app.use(express.json());

    function withPersistence(fn) {
        return async (body) => {
            const c = await repository.load(body.uuid);
            fn(c, body);
            await repository.save(c);
        };
    }

    function withErrorHandling(fn) {
        return async function(req, res) {
            try {
                await fn(req.body);
                res.status(204).send();
            } catch (e) {
                if (e instanceof ClientError) {
                    res.status(400).json({error: e.message});
                }
                console.log(e);
                res.status(500).send();
            }
        };
    }

    function handle(command) {
        return withErrorHandling(withPersistence(command));
    }

    app.post('/limit', handle((c, body) => {
        c.assignLimit(body.amount);
    }));
    app.post('/withdrawal', handle((c, body) => {
        c.withdraw(body.amount);
    }));
    app.post('/repayment', handle((c, body) => {
        c.repay(body.amount);
    }));
    app.get('/limit/:uuid', async function (req, res) {
        const c = await repository.load(req.params.uuid);
        res.json({uuid: c.uuid(), limit: c.availableLimit()});
    });
    app.get('/events', async function (req, res) {
        const skip = Number(req.query.skip) || 0;
        const limit = Math.min(Number(req.query.limit) || 10, 10);
        const events = await repository.loadEvents({skip, limit});

        function paginationLink({skip, limit, results}) {
            const prevLink = skip > 0 ? `</events?skip=${Math.max(0, skip - limit)}&limit=${limit}>; rel="prev"` : "";
            const nextLink = results === limit ? `</events?skip=${skip + limit}&limit=${limit}>; rel="next"` : "";

            return [prevLink, nextLink].filter(x => x).join("; ");
        }

        res.header("Link", paginationLink({skip, limit, results: events.length}));

        res.json(events);
    });

    app.close = function() {
        return es.close();
    };

    return app;
};