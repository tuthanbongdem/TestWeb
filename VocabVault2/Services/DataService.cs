using VocabVault2.Models;

namespace VocabVault2.Services;

public class DataService
{
    private readonly SupabaseService _supa;
    private List<Word>   _words   = new();
    private List<Phrase> _phrases = new();
    private bool _loaded = false;

    public event Action? OnChange;
    public DataService(SupabaseService supa) { _supa = supa; }

    public async Task LoadAsync()
    {
        if (_loaded) return;
        _words   = await _supa.GetWordsAsync();
        _phrases = await _supa.GetPhrasesAsync();
        _loaded  = true;
    }

    // ── WORDS ────────────────────────────────────────────────────────────────
    public IReadOnlyList<Word> Words => _words.AsReadOnly();

    public async Task AddWordAsync(Word w)
    {
        var saved = await _supa.AddWordAsync(w);
        if (saved != null) { _words.Insert(0, saved); Notify(); }
    }

    public async Task DeleteWordAsync(int id)
    {
        await _supa.DeleteWordAsync(id);
        _words.RemoveAll(w => w.Id == id); Notify();
    }

    public async Task ToggleWordFavAsync(int id)
    {
        var w = FindW(id); if (w == null) return;
        w.Favorite = !w.Favorite;
        await _supa.UpdateWordAsync(w); Notify();
    }

    public async Task SetMasteryAsync(int id, int lvl)
    {
        var w = FindW(id); if (w == null) return;
        w.Mastery = Math.Clamp(lvl, 0, 5);
        await _supa.UpdateWordAsync(w); Notify();
    }

    public async Task BumpMasteryAsync(int id, int delta)
    {
        var w = FindW(id); if (w == null) return;
        w.Mastery = Math.Clamp(w.Mastery + delta, 0, 5);
        await _supa.UpdateWordAsync(w); Notify();
    }

    public bool WordExists(string eng) =>
        _words.Any(w => w.English.Equals(eng.Trim(), StringComparison.OrdinalIgnoreCase));

    private Word? FindW(int id) => _words.FirstOrDefault(w => w.Id == id);

    // ── PHRASES ──────────────────────────────────────────────────────────────
    public IReadOnlyList<Phrase> Phrases => _phrases.AsReadOnly();

    public async Task AddPhraseAsync(Phrase p)
    {
        var saved = await _supa.AddPhraseAsync(p);
        if (saved != null) { _phrases.Insert(0, saved); Notify(); }
    }

    public async Task DeletePhraseAsync(int id)
    {
        await _supa.DeletePhraseAsync(id);
        _phrases.RemoveAll(p => p.Id == id); Notify();
    }

    public async Task TogglePhraseFavAsync(int id)
    {
        var p = FindP(id); if (p == null) return;
        p.Favorite = !p.Favorite;
        await _supa.UpdatePhraseAsync(p); Notify();
    }

    public bool PhraseExists(string eng) =>
        _phrases.Any(p => p.English.Equals(eng.Trim(), StringComparison.OrdinalIgnoreCase));

    private Phrase? FindP(int id) => _phrases.FirstOrDefault(p => p.Id == id);

    private void Notify() => OnChange?.Invoke();
}
