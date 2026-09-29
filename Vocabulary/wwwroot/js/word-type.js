window.lookupWordTypes = async function (english) {
    const word = String(english ?? '').trim().replace(/\s+/g, ' ');
    if (!word) return ['Other'];
    if (word.includes(' ')) return ['Phrase'];

    const typeMap = {
        noun: 'Noun',
        verb: 'Verb',
        adjective: 'Adj',
        adverb: 'Adv'
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return ['Other'];

        const entries = await response.json();
        if (!Array.isArray(entries)) return ['Other'];

        const types = [...new Set(entries.flatMap(entry =>
            Array.isArray(entry.meanings)
                ? entry.meanings.map(meaning => typeMap[meaning.partOfSpeech]).filter(Boolean)
                : []
        ))];
        return types.length ? types : ['Other'];
    } catch {
        return ['Other'];
    } finally {
        clearTimeout(timeoutId);
    }
};
