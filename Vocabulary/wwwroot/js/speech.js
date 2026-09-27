// ── TEXT TO SPEECH ────────────────────────────────────────────────────────
window.speakText = function (text, rate) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = rate || 0.88;
    utt.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find(v => v.lang.toLowerCase() === 'en-us')
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

// These are practice suggestions for sounds known to occur in the target word.
// SpeechRecognition returns text, not phoneme-level errors, so this does not
// identify which sound the learner actually produced incorrectly.
const SOUND_GUIDES = {
    theta: {
        symbol: '/θ/', shape: 'tongue-teeth',
        instructions: 'Đưa đầu lưỡi nhẹ giữa hai hàm răng, thổi hơi đều qua khe răng. Không rung cổ họng; tránh đọc thành /t/ hoặc /s/.'
    },
    eth: {
        symbol: '/ð/', shape: 'tongue-teeth',
        instructions: 'Đưa đầu lưỡi nhẹ giữa hai hàm răng và đẩy hơi ra. Đặt tay lên cổ để cảm nhận dây thanh rung; tránh đọc thành /d/.'
    },
    v: {
        symbol: '/v/', shape: 'lip-teeth',
        instructions: 'Để răng trên chạm nhẹ môi dưới, đẩy hơi ra liên tục và cho dây thanh rung. Không mím hai môi như âm /b/.'
    },
    w: {
        symbol: '/w/', shape: 'rounded-lips',
        instructions: 'Chu môi tròn nhỏ rồi mở nhanh sang nguyên âm tiếp theo. Hai hàm răng không chạm môi dưới như âm /v/.'
    },
    r: {
        symbol: '/ɹ/', shape: 'tongue-raised',
        instructions: 'Nâng phần trước của lưỡi gần vòm miệng nhưng không chạm vào. Hơi tròn môi và giữ luồng hơi liên tục, không rung đầu lưỡi.'
    },
    l: {
        symbol: '/l/', shape: 'tongue-ridge',
        instructions: 'Chạm đầu lưỡi vào gờ ngay sau răng trên. Cho hơi đi qua hai bên lưỡi và giữ dây thanh rung.'
    },
    ae: {
        symbol: '/æ/', shape: 'open-wide',
        instructions: 'Hạ hàm và mở miệng khá rộng theo chiều ngang. Lưỡi đặt thấp, hướng ra trước; âm ngắn, không đọc thành /e/.'
    }
};

const VOICED_TH_WORDS = new Set(['the', 'this', 'that', 'these', 'those', 'they', 'them', 'their', 'there', 'then', 'than', 'though', 'thus', 'mother', 'father', 'brother', 'other', 'another', 'weather', 'rather']);
const VOICELESS_TH_WORDS = new Set(['think', 'thank', 'thanks', 'thing', 'things', 'thought', 'through', 'three', 'thousand', 'theory', 'thesis', 'thrive', 'third', 'thirty', 'thin', 'thick', 'thunder']);
const AE_WORDS = new Set(['cat', 'bad', 'map', 'apple', 'academic', 'practice']);

window.getPronunciationGuide = function (word) {
    const w = normalise(word);
    if (!w || w.includes(' ')) return null;
    if (VOICED_TH_WORDS.has(w)) return SOUND_GUIDES.eth;
    if (VOICELESS_TH_WORDS.has(w)) return SOUND_GUIDES.theta;
    if (/^v[aeiou]/.test(w)) return SOUND_GUIDES.v;
    if (/^w[aeiou]/.test(w)) return SOUND_GUIDES.w;
    if (/^r[aeiou]/.test(w)) return SOUND_GUIDES.r;
    if (/^l[aeiou]/.test(w)) return SOUND_GUIDES.l;
    if (AE_WORDS.has(w)) return SOUND_GUIDES.ae;
    return null;
};

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
        wordResults.push({
            target: tw, spoken: sw || '—', status, sim: Math.round(sim * 100),
            guide: status === 'correct' ? null : window.getPronunciationGuide(tw)
        });
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
            msg = `Từ mẫu “${r.target}”: trình duyệt nghe thành “${r.spoken}”. Hãy nghe mẫu rồi thử lại.`;
        } else {
            msg = `Từ mẫu “${r.target}”: Trình duyệt nghe thành “${r.spoken}”. Hãy luyện lại từ này.`;
        }
        feedback.push({ word: r.target, type: r.status, msg });
    }

    if (percent === 100) {
        feedback.push({ word: '', type: 'perfect', msg: '🎉 Trình duyệt đã nhận đúng toàn bộ từ trong câu.' });
    } else if (percent >= 80) {
        feedback.push({ word: '', type: 'good', msg: '👍 Tốt lắm! Chỉ cần tinh chỉnh một vài từ.' });
    } else if (percent >= 50) {
        feedback.push({ word: '', type: 'ok', msg: '💪 Được rồi! Luyện thêm để cải thiện độ chính xác.' });
    } else {
        feedback.push({ word: '', type: 'poor', msg: '🔁 Hãy nghe mẫu kỹ rồi thử lại — đọc chậm từng từ trước.' });
    }

    return { percent, wordResults, feedback };
}
