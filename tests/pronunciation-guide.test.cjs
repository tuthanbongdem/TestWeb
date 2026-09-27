const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../Vocabulary/wwwroot/js/speech.js'), 'utf8');

function loadSpeech() {
    const context = {
        window: {
            speechSynthesis: { getVoices: () => [], cancel() {}, speak() {} }
        }
    };
    vm.runInNewContext(source, context);
    return context;
}

test('voiceless and voiced th get different mouth guidance', () => {
    const { window } = loadSpeech();
    const think = window.getPronunciationGuide('think');
    const thisWord = window.getPronunciationGuide('this');

    assert.equal(think.symbol, '/θ/');
    assert.equal(thisWord.symbol, '/ð/');
    assert.equal(think.shape, 'tongue-teeth');
    assert.match(thisWord.instructions, /rung/);
});

test('v and w get distinct lip positions', () => {
    const { window } = loadSpeech();
    assert.equal(window.getPronunciationGuide('very').shape, 'lip-teeth');
    assert.equal(window.getPronunciationGuide('water').shape, 'rounded-lips');
});

test('unknown words do not receive invented sound guidance', () => {
    const { window } = loadSpeech();
    assert.equal(window.getPronunciationGuide('island'), null);
    assert.equal(window.getPronunciationGuide('Thomas'), null);
});

test('sound guidance appears only for a word the recognizer mismatches', () => {
    const context = loadSpeech();
    const mismatch = context.scorePronunciation('sink', 'think');
    const correct = context.scorePronunciation('think', 'think');

    assert.equal(mismatch.wordResults[0].guide.symbol, '/θ/');
    assert.equal(correct.wordResults[0].guide, null);
});

test('recognition feedback describes heard text without claiming a phoneme diagnosis', () => {
    const context = loadSpeech();
    const result = context.scorePronunciation('sink', 'think');

    assert.match(result.feedback[0].msg, /Trình duyệt nghe/);
    assert.doesNotMatch(result.feedback[0].msg, /phát âm sai|phát âm chuẩn/);
});
