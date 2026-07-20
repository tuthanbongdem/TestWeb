using System.Net.Http.Json;
using System.Text.Json;

namespace Vocabulary.Services;

public class GeminiService
{
    private readonly HttpClient _http;
    private string _apiKey = "";
    private const string ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    public GeminiService(HttpClient http) { _http = http; }

    public bool HasKey => !string.IsNullOrWhiteSpace(_apiKey);
    public void SetKey(string key) => _apiKey = key.Trim();
    public string GetKey() => _apiKey;

    public async Task<string> AskAsync(string prompt)
    {
        if (!HasKey) return "⚠ Chưa có API key!";
        var url  = ENDPOINT + "?key=" + _apiKey;
        var body = new { contents = new[] { new { parts = new[] { new { text = prompt } } } } };
        try
        {
            var resp = await _http.PostAsJsonAsync(url, body);
            var raw  = await resp.Content.ReadAsStringAsync();
            if (!resp.IsSuccessStatusCode)
            {
                using var errDoc = JsonDocument.Parse(raw);
                var msg = errDoc.RootElement
                    .GetProperty("error").GetProperty("message").GetString();
                return "❌ Lỗi API: " + msg;
            }
            using var doc = JsonDocument.Parse(raw);
            return doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString() ?? "(trống)";
        }
        catch (Exception ex) { return "❌ Lỗi kết nối: " + ex.Message; }
    }
}
