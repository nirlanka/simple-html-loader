const parse = require('./index');

const assertErr = 'Assert failed';
let fn;

function _(isTrue, desc) {
    void 0 === fn.__count && (fn.__count = 0);
    fn.__count++;
    isTrue && printPass(desc);
    !isTrue && printFail(assertErr, desc);
    return true;
}

function printPass(err, desc) {
    console.info('PASSED at fn', fn.name, '\n\tat case', fn.__count + (desc ? ` "${desc}"` : ''));
}

function printFail(err, desc) {
    console.error('FAILED at fn', fn.name, '\n\tat case', fn.__count + (desc ? ` "${desc}"` : ''), '\n\tERROR:', err);
}

try {
    (fn = function test_simple_empty_container_element() {
        const res = parse(`<div></div>`);

        switch (0) {
            case _(res.length === 1, 'Only one element'):
            case _(res[0].name === 'div'):
            return;
        }
    })();

    // 
} catch (err) {
    printFail(err);
}