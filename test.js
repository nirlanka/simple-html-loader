const parse = require('./index');

const assertErr = 'Assert failed';
let fn;

function _(res) {
    if (!fn.__count) {
        fn.__count = 0;
    }
    fn.__count++;
    !res && printError();
    return !res;
}

function printError(err) {
    console.error('at fn', fn.name, 'at case', fn.__count, 'ERROR:', err || assertErr);
}

try {
    (fn = function test_simple_empty_container_element() {
        const res = parse(`<div></div>`);

        switch (0) {
            case _(res.length === 1):
            case _(res[0].name === 'div'):
                return;
            default:
                throw assertErr;
        }
    })();

    // 
} catch (err) {
    printError(err);
}