// const code = `<div class="my-class">
//     Para
//     <!DOCTYPE html>
//     <span>Abc</span>
//     <span>
//         Def abcdef
//         <img href="./img.png" data-type="whatever">
//         Ghi jkl
//         <p>
//             <h1>Hello <a href="#">World</a></h1>
//         </p>
//     </span>
// </div>`;

// TOKENIZE //

function tokenize(code) {
    return code.split(/([<>\s="\/]{1})/g)
        .filter(Boolean);
}

// OPS //

/** 
 * @typedef {object} Operator 
 *
 * @member {number} type - OPS member
 * 
 * @member {Operator[]} [children] - Tag op
 * @member {Operator[]} [attribs] - Tag op
 * @member {Boolean} [isClosed] - Tag, Attrib op
 * 
 * @member {Boolean} [isPre] - Text op
 * @member {string} [content] - Text op
 * 
 * @member {string} [value] - Attrib op
*/

function createTagOp() {
    return {
        type: OPS.TAG,
        name: '',
        attribs: [],
        isClosed: false,
    };
}

function createAttribOp() {
    return {
        type: OPS.ATTRIB,
        key: '',
        value: '',
        isClosed: true // for value-less attributes
    };
}

function createTextOp() {
    return {
        type: OPS.TEXT,
        content: '',
        isPre: false
    }
}

let _opIdx = 0;
const OPS = {};
[
    'ATTRIB',
    'TAG',
    'TEXT'
].forEach(s => { OPS[s] = _opIdx++ });

// PARSE //

const opStack = [];
let i = 0;

function getLastOp() {
    return opStack[opStack.length-1];
}

let _tokens;

function lookAhead(di) {
    return _tokens[i + di];
}

function getAhead(n) {
    return _tokens.slice(i, i + n);
}

function popAhead(n) {
    // const _i = i;
    // i += n;
    // return _tokens.splice(_i + 1, n);
    return _tokens.splice(i, i + n);
}

const regexCloseElementStart = /^<[\s]*\//;
const regexCloseElement = /^<\/[\s]*([\w\-]+)[\s]*>$/;

function handleCloseElement(matchRes, opStack) {
    const children = [];
    const name = matchRes[1];
    while (getLastOp().name !== name) {
        children.push(opStack.pop());
    }
    // Must be at OPS.TAG with correct name now.

    getLastOp().children = children;
}

const rules = [
    {
        regex: /</,
        handler: function handleOpenTag() {
            opStack.push(createTagOp());

            let di = 1;
            while (lookAhead(di++) !== '/') {
            }
            // Must be at the start of the closing tag (if it is)
            
            if (getAhead(di).join('').match(regexCloseElementStart)) {
                while (lookAhead(di++) !== '>') {
                }
                // Must be at the end of the closing tag
                
                handleCloseElement(popAhead(di).join('').match(regexCloseElement), opStack);
            }
        }
    },
    {
        regex: />/,
        handler: function handleCloseTag() {
            const attribs = [];
            while (getLastOp().type === OPS.ATTRIB) {
                attribs.push(opStack.pop());
            }
            // Must be at OPS.TAG now.

            getLastOp().attribs = attribs;
            getLastOp().isClosed = true;

            if (getLastOp().name.toLowerCase() === 'pre') {
                opStack.push(createTextOp());
                getLastOp().isPre = true;
            }
        }
    },
    {
        regex: /"/,
        handler: function handleQuote() {
            if (getLastOp().type === OPS.TAG && !getLastOp().isClosed) {
                opStack.push(createAttribOp());
            } else if (getLastOp().type === OPS.TAG) {
                opStack.push(createTextOp());
                getLastOp().content += '"';
            } else if (getLastOp().type === OPS.ATTRIB) {
                getLastOp().isClosed = true;
            } else { // Can only be OPS.TEXT.
                getLastOp().content += '"';
            }
        }
    },
    {
        regex: /(\s+)/,
        handler: function handleWhitespace(matchRes) {
            if (getLastOp().type === OPS.TEXT && getLastOp().isPre) {
                getLastOp().content += matchRes[0];
            } else if (getLastOp().type === OPS.TAG && getLastOp().isClosed) {
                opStack.push(createTextOp());
            } else if (getLastOp().type === OPS.ATTRIB && !getLastOp().isClosed) {
                getLastOp().value += matchRes[0];
            } else if (getLastOp().type === OPS.TEXT) { // Can't be an else!
                getLastOp().content += ' ';
            }
        }
    },
    {
        regex: /=/,
        handler: function handleEqual() {
            if (getLastOp().type === OPS.ATTRIB) {
                getLastOp().isClosed = false;
            } else if (getLastOp().type === OPS.TAG) {
                opStack.push(createTextOp());
                getLastOp().content += '=';
            } else { // Can only be OPS.TEXT.
                getLastOp().content += '=';
            }
        }
    },
    {
        regex: /(.+)/,
        handler: function handleAll(matchRes) {
            if (getLastOp().type === OPS.TEXT) {
                getLastOp().content += matchRes[0];
            } else if (getLastOp().type === OPS.ATTRIB && !getLastOp().isClosed) {
                getLastOp().value += matchRes[0];
            } else if (getLastOp().type === OPS.ATTRIB) {
                opStack.push(createAttribOp());
                getLastOp().key = matchRes[0];
            } else if (getLastOp().type === OPS.TAG && !getLastOp().name) {
                getLastOp().name = matchRes[0];
            } else if (getLastOp().type === OPS.TAG && !getLastOp().isClosed) {
                opStack.push(createAttribOp());
                getLastOp().content += matchRes[0];
            } else {
                opStack.push(createTextOp());
                getLastOp().content += matchRes[0];
            }
        }
    }
];

function parse(tokens) {
    _tokens = tokens;

    for (i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        let matchRes;
        const rule = rules.find(r => matchRes = token.match(r.regex));

        if (!rule) {
            console.error('Unhandled token:', '"' + token + '"');
            break;
        }

        rule.handler(matchRes);
    }

    return opStack;
}

// RUN PARSER //

module.exports = function parseCode(code) {
    return parse(tokenize(code));
}