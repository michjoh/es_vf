(async () => {
    const es = await require('./es')();
    const app = require('./app')(es);
    app.listen(3000);
})();