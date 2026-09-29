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

    async function request(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        try {
            const response = await fetch(url, { signal: controller.signal });
            return response.ok ? await response.json() : null;
        } catch {
            return null;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    const entries = await request(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    const dictionaryTypes = Array.isArray(entries) ? [...new Set(entries.flatMap(entry =>
        Array.isArray(entry.meanings)
            ? entry.meanings.map(meaning => typeMap[meaning.partOfSpeech]).filter(Boolean)
            : []
    ))] : [];
    if (dictionaryTypes.length) return dictionaryTypes;

    const matches = await request(`https://api.datamuse.com/words?sp=${encodeURIComponent(word.toLowerCase())}&md=p&max=1`);
    const match = Array.isArray(matches) && matches.find(item =>
        item.word?.toLowerCase() === word.toLowerCase());
    const tagMap = { n: 'Noun', v: 'Verb', adj: 'Adj', adv: 'Adv' };
    const types = match && Array.isArray(match.tags)
        ? [...new Set(match.tags.map(tag => tagMap[tag]).filter(Boolean))]
        : [];
    return types.length ? types : ['Other'];
};
