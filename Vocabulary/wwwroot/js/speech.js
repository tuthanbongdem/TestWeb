// ── TEXT TO SPEECH ────────────────────────────────────────────────────────
window.speakText = function (text, rate) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = rate || 0.88;
    utt.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google'))
            || voices.find(v => v.lang.startsWith('en-US'))
            || voices.find(v => v.lang.startsWith('en'));
    if (en) utt.voice = en;
    window.speechSynthesis.speak(utt);
};
window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };

// ── SPEECH RECOGNITION ───────────────────────────────────────────────────
let _recog = null;

window.checkSpeechSupport = function () {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};

window.startSpeechRecognition = function (dotnetRef, targetText) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { dotnetRef.invokeMethodAsync('OnRecogResult', null, 'NOT_SUPPORTED'); return; }

    if (_recog) { try { _recog.stop(); } catch(e){} }

    _recog = new SR();
    _recog.lang = 'en-US';
    _recog.interimResults = false;
    _recog.maxAlternatives = 3;
    _recog.continuous = false;

    _recog.onresult = (e) => {
        // collect all alternatives, pick best match
        const alts = [];
        for (let i = 0; i < e.results[0].length; i++) {
            alts.push(e.results[0][i].transcript.trim());
        }
        const best = alts[0];
        const score = scorePronunciation(best, targetText);
        const result = JSON.stringify({ spoken: best, alternatives: alts, score: score });
        dotnetRef.invokeMethodAsync('OnRecogResult', result, 'OK');
    };
    _recog.onerror = (e) => {
        dotnetRef.invokeMethodAsync('OnRecogResult', null, e.error);
    };
    _recog.onend = () => {
        dotnetRef.invokeMethodAsync('OnRecogEnd');
    };
    _recog.start();
};

window.stopSpeechRecognition = function () {
    if (_recog) { try { _recog.stop(); } catch(e){} _recog = null; }
};

// ── SCORING ENGINE ────────────────────────────────────────────────────────
function normalise(s) {
    return s.toLowerCase()
            .replace(/[^\w\s']/g, '')
            .replace(/\s+/g, ' ')
            .trim();
}

function tokenise(s) { return normalise(s).split(' ').filter(Boolean); }

// Levenshtein distance for word-level comparison
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({length: m+1}, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
                : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
}

// phonetic similarity hints (common Vietnamese-speaker mistakes)
const PHONETIC_TIPS = {
    'th': 'Âm "th" đặt lưỡi sát răng cửa, thổi hơi (không phải "d" hay "t")',
    'v':  'Âm "v" môi trên chạm răng dưới, rung (khác "b")',
    'r':  'Âm "r" cuộn lưỡi lên, không rung như tiếng Việt',
    'l':  'Âm "l" cuối từ (final L): lưỡi chạm hàm ếch',
    'ed': 'Đuôi "-ed": /t/ sau p,k,f,s,ch — /d/ sau âm hữu thanh — /ɪd/ sau t,d',
    's':  'Đuôi "-s/-es": /s/ sau âm vô thanh — /z/ sau âm hữu thanh',
    'w':  'Âm "w" môi tròn rồi mở, không phải "u" hay "qu"',
    'æ':  'Nguyên âm "a" như "cat": miệng mở rộng ngang',
    'ŋ':  'Âm "-ng" cuối: khoá hầu họng, không bật hơi',
};

function getPhoneticTip(word) {
    const w = word.toLowerCase();
    if (w.startsWith('th')) return PHONETIC_TIPS['th'];
    if (/ed$/.test(w)) return PHONETIC_TIPS['ed'];
    if (/[szes]$/.test(w) && w.length > 2) return PHONETIC_TIPS['s'];
    if (w.includes('w')) return PHONETIC_TIPS['w'];
    if (w.includes('r') && !w.startsWith('r')) return PHONETIC_TIPS['r'];
    if (/ng$/.test(w)) return PHONETIC_TIPS['ŋ'];
    if (w.startsWith('v')) return PHONETIC_TIPS['v'];
    return null;
}

function scorePronunciation(spoken, target) {
    const spokenWords  = tokenise(spoken);
    const targetWords  = tokenise(target);

    if (!spokenWords.length) return { percent: 0, wordResults: [], feedback: [] };

    // align words greedily
    const wordResults = [];
    let si = 0;
    for (let ti = 0; ti < targetWords.length; ti++) {
        const tw = targetWords[ti];
        const sw = spokenWords[si] || '';
        const dist = levenshtein(sw, tw);
        const maxLen = Math.max(sw.length, tw.length) || 1;
        const sim = 1 - dist / maxLen;
        const status = dist === 0 ? 'correct' : sim >= 0.7 ? 'close' : 'wrong';
        wordResults.push({ target: tw, spoken: sw || '—', status, sim: Math.round(sim * 100) });
        if (sw) si++;
    }

    // missing words at end
    while (si < spokenWords.length) {
        wordResults.push({ target: '(extra)', spoken: spokenWords[si], status: 'extra', sim: 0 });
        si++;
    }

    const correct = wordResults.filter(r => r.status === 'correct').length;
    const close   = wordResults.filter(r => r.status === 'close').length;
    const percent = Math.round((correct + close * 0.5) / targetWords.length * 100);

    // build human feedback
    const feedback = [];
    for (const r of wordResults) {
        if (r.status === 'correct') continue;
        if (r.status === 'extra') {
            feedback.push({ word: r.spoken, type: 'extra', msg: `Bạn thêm từ "${r.spoken}" không có trong câu.` });
            continue;
        }
        if (r.status === 'wrong' && r.spoken === '—') {
            feedback.push({ word: r.target, type: 'missing', msg: `Bỏ sót từ "${r.target}" — hãy đọc đầy đủ câu.` });
            continue;
        }

        let msg = '';
        if (r.status === 'close') {
            msg = `"${r.target}": bạn đọc gần đúng ("${r.spoken}") — chú ý phát âm chính xác hơn.`;
        } else {
            msg = `"${r.target}": bạn đọc là "${r.spoken}" — sai, cần luyện lại từ này.`;
        }
        const tip = getPhoneticTip(r.target);
        if (tip) msg += ' 💡 ' + tip;
        feedback.push({ word: r.target, type: r.status, msg });
    }

    if (percent === 100) {
        feedback.push({ word: '', type: 'perfect', msg: '🎉 Hoàn hảo! Phát âm chuẩn xác toàn bộ câu.' });
    } else if (percent >= 80) {
        feedback.push({ word: '', type: 'good', msg: '👍 Tốt lắm! Chỉ cần tinh chỉnh một vài từ.' });
    } else if (percent >= 50) {
        feedback.push({ word: '', type: 'ok', msg: '💪 Được rồi! Luyện thêm để cải thiện độ chính xác.' });
    } else {
        feedback.push({ word: '', type: 'poor', msg: '🔁 Hãy nghe mẫu kỹ rồi thử lại — đọc chậm từng từ trước.' });
    }

    return { percent, wordResults, feedback };
}
