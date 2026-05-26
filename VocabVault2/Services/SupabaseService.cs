using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using VocabVault2.Models;

namespace VocabVault2.Services;

/// <summary>
/// Giao tiếp với Supabase REST API — data lưu trên cloud, mọi máy đều thấy.
/// </summary>
public class SupabaseService
{
    private readonly HttpClient _http;
    private static readonly JsonSerializerOptions _json = new()
    {
        PropertyNamingPolicy        = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition      = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true,
    };

    public SupabaseService(HttpClient http)
    {
        _http = http;
        _http.DefaultRequestHeaders.Add("apikey", SupabaseConfig.Key);
        _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {SupabaseConfig.Key}");
    }

    // ── WORDS ────────────────────────────────────────────────────────────────

    public async Task<List<Word>> GetWordsAsync()
    {
        var req = new HttpRequestMessage(HttpMethod.Get, SupabaseConfig.WordsTable + "?order=created_at.desc");
        var res = await _http.SendAsync(req);
        if (!res.IsSuccessStatusCode) return new();
        var json = await res.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<SupaWord>>(json, _json)
               ?.Select(ToWord).ToList() ?? new();
    }

    public async Task<Word?> AddWordAsync(Word w)
    {
        var body = JsonSerializer.Serialize(ToSupaWord(w), _json);
        var req  = new HttpRequestMessage(HttpMethod.Post, SupabaseConfig.WordsTable);
        req.Headers.Add("Prefer", "return=representation");
        req.Content = new StringContent(body, Encoding.UTF8, "application/json");
        var res  = await _http.SendAsync(req);
        if (!res.IsSuccessStatusCode) return null;
        var json = await res.Content.ReadAsStringAsync();
        var list = JsonSerializer.Deserialize<List<SupaWord>>(json, _json);
        return list?.FirstOrDefault() is { } sw ? ToWord(sw) : null;
    }

    public async Task DeleteWordAsync(int id)
    {
        await _http.DeleteAsync($"{SupabaseConfig.WordsTable}?id=eq.{id}");
    }

    public async Task UpdateWordAsync(Word w)
    {
        var body = JsonSerializer.Serialize(ToSupaWord(w), _json);
        var req  = new HttpRequestMessage(HttpMethod.Patch, $"{SupabaseConfig.WordsTable}?id=eq.{w.Id}");
        req.Content = new StringContent(body, Encoding.UTF8, "application/json");
        await _http.SendAsync(req);
    }

    // ── PHRASES ──────────────────────────────────────────────────────────────

    public async Task<List<Phrase>> GetPhrasesAsync()
    {
        var req = new HttpRequestMessage(HttpMethod.Get, SupabaseConfig.PhrasesTable + "?order=created_at.desc");
        var res = await _http.SendAsync(req);
        if (!res.IsSuccessStatusCode) return new();
        var json = await res.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<SupaPhrase>>(json, _json)
               ?.Select(ToPhrase).ToList() ?? new();
    }

    public async Task<Phrase?> AddPhraseAsync(Phrase p)
    {
        var body = JsonSerializer.Serialize(ToSupaPhrase(p), _json);
        var req  = new HttpRequestMessage(HttpMethod.Post, SupabaseConfig.PhrasesTable);
        req.Headers.Add("Prefer", "return=representation");
        req.Content = new StringContent(body, Encoding.UTF8, "application/json");
        var res  = await _http.SendAsync(req);
        if (!res.IsSuccessStatusCode) return null;
        var json = await res.Content.ReadAsStringAsync();
        var list = JsonSerializer.Deserialize<List<SupaPhrase>>(json, _json);
        return list?.FirstOrDefault() is { } sp ? ToPhrase(sp) : null;
    }

    public async Task DeletePhraseAsync(int id)
    {
        await _http.DeleteAsync($"{SupabaseConfig.PhrasesTable}?id=eq.{id}");
    }

    public async Task UpdatePhraseAsync(Phrase p)
    {
        var body = JsonSerializer.Serialize(ToSupaPhrase(p), _json);
        var req  = new HttpRequestMessage(HttpMethod.Patch, $"{SupabaseConfig.PhrasesTable}?id=eq.{p.Id}");
        req.Content = new StringContent(body, Encoding.UTF8, "application/json");
        await _http.SendAsync(req);
    }

    // ── MAPPING ──────────────────────────────────────────────────────────────

    static Word ToWord(SupaWord s) => new()
    {
        Id = s.Id ?? 0, English = s.English ?? "", Phonetic = s.Phonetic ?? "",
        Vietnamese = s.Vietnamese ?? "", Type = Enum.TryParse<WordType>(s.Type, out var t) ? t : WordType.Other,
        Example = s.Example ?? "", Mastery = s.Mastery, Favorite = s.Favorite,
        CreatedAt = s.CreatedAt,
    };

    static SupaWord ToSupaWord(Word w) => new()
    {
        Id = w.Id > 0 ? w.Id : null, English = w.English, Phonetic = w.Phonetic,
        Vietnamese = w.Vietnamese, Type = w.Type.ToString(),
        Example = w.Example, Mastery = w.Mastery, Favorite = w.Favorite,
    };

    static Phrase ToPhrase(SupaPhrase s) => new()
    {
        Id = s.Id ?? 0, English = s.English ?? "", Vietnamese = s.Vietnamese ?? "",
        Note = s.Note ?? "", Situation = s.Situation ?? "Daily", Favorite = s.Favorite,
        CreatedAt = s.CreatedAt,
    };

    static SupaPhrase ToSupaPhrase(Phrase p) => new()
    {
        Id = p.Id > 0 ? p.Id : null, English = p.English, Vietnamese = p.Vietnamese,
        Note = p.Note, Situation = p.Situation, Favorite = p.Favorite,
    };

    // ── Supabase DTOs (snake_case) ────────────────────────────────────────────

    class SupaWord
    {
        public int?    Id         { get; set; }  // null = auto-increment on insert
        public string? English    { get; set; }
        public string? Phonetic   { get; set; }
        public string? Vietnamese { get; set; }
        public string? Type       { get; set; }
        public string? Example    { get; set; }
        public int     Mastery    { get; set; }
        public bool    Favorite   { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    class SupaPhrase
    {
        public int?    Id          { get; set; }
        public string? English     { get; set; }
        public string? Vietnamese  { get; set; }
        public string? Note        { get; set; }
        public string? Situation   { get; set; }
        public bool    Favorite    { get; set; }
        public DateTime CreatedAt  { get; set; }
    }
}
