const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '../Vocabulary/wwwroot/js/word-type.js');
const source = fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath, 'utf8') : '';

function lookupWith(fetchImpl, timers = {}) {
    const context = {
        window: {}, fetch: fetchImpl, AbortController,
        setTimeout: timers.setTimeout ?? setTimeout,
        clearTimeout: timers.clearTimeout ?? clearTimeout
    };
    vm.runInNewContext(source, context);
    return context.window.lookupWordTypes;
}

test('identifies an adjective from dictionary meanings', async () => {
    const lookup = lookupWith(async () => ({
        ok: true,
        json: async () => [{ meanings: [{ partOfSpeech: 'adjective' }] }]
    }));

    assert.equal(typeof lookup, 'function');
    assert.deepEqual(Array.from(await lookup('beautiful')), ['Adj']);
});

test('keeps distinct dictionary types for an ambiguous word', async () => {
    const lookup = lookupWith(async url => {
        assert.equal(url, 'https://api.dictionaryapi.dev/api/v2/entries/en/run');
        return {
            ok: true,
            json: async () => [{ meanings: [
                { partOfSpeech: 'verb' },
                { partOfSpeech: 'noun' },
                { partOfSpeech: 'verb' }
            ] }]
        };
    });

    assert.deepEqual(Array.from(await lookup(' run ')), ['Verb', 'Noun']);
});

test('classifies a multiword phrase without requesting the dictionary', async () => {
    const lookup = lookupWith(() => { throw new Error('Dictionary should not be called'); });
    assert.deepEqual(Array.from(await lookup('on a regular basis')), ['Phrase']);
});

test('uses Other when the dictionary has no supported type or is unavailable', async () => {
    const missing = lookupWith(async () => ({ ok: false }));
    const offline = lookupWith(async () => { throw new Error('offline'); });
    const unsupported = lookupWith(async () => ({
        ok: true,
        json: async () => [{ meanings: [{ partOfSpeech: 'interjection' }] }]
    }));

    assert.deepEqual(Array.from(await missing('unknown')), ['Other']);
    assert.deepEqual(Array.from(await offline('unknown')), ['Other']);
    assert.deepEqual(Array.from(await unsupported('hello')), ['Other']);
});

test('a stalled dictionary request stops and leaves manual classification available', async () => {
    let aborted = false;
    const lookup = lookupWith((_, options) => new Promise((_, reject) => {
        options.signal.addEventListener('abort', () => {
            aborted = true;
            reject(new Error('aborted'));
        });
    }), {
        setTimeout: callback => { queueMicrotask(callback); return 1; },
        clearTimeout: () => {}
    });

    assert.deepEqual(Array.from(await lookup('beautiful')), ['Other']);
    assert.equal(aborted, true);
});

test('uses a second dictionary when the first is unavailable for intriguing', async () => {
    const lookup = lookupWith(async url => {
        if (url.includes('dictionaryapi.dev')) throw new Error('dictionary unavailable');
        if (url === 'https://api.datamuse.com/words?sp=intriguing&md=p&max=1') {
            return { ok: true, json: async () => [
                { word: 'intriguing', score: 323097, tags: ['adj', 'n'] }
            ] };
        }
        throw new Error(`Unexpected URL: ${url}`);
    });

    assert.deepEqual(Array.from(await lookup('Intriguing')), ['Adj', 'Noun']);
});
