namespace VocabVault2.Models;

public enum WordType { Noun, Verb, Adj, Adv, Phrase, Other }

public static class WordTypeExt
{
    public static string Label(this WordType t) => t switch
    {
        WordType.Noun => "Noun", WordType.Verb => "Verb", WordType.Adj => "Adj",
        WordType.Adv => "Adv", WordType.Phrase => "Phrase", _ => "Other"
    };
    public static string Color(this WordType t) => t switch
    {
        WordType.Noun => "#4ade80", WordType.Verb => "#38bdf8", WordType.Adj => "#fb923c",
        WordType.Adv => "#a78bfa", WordType.Phrase => "#f472b6", _ => "#94a3b8"
    };
}

public class Word
{
    public int Id { get; set; }
    public string English { get; set; } = "";
    public string Phonetic { get; set; } = "";
    public string Vietnamese { get; set; } = "";
    public WordType Type { get; set; }
    public string Example { get; set; } = "";
    public int Mastery { get; set; }      // 0-5
    public bool Favorite { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}

public class Phrase
{
    public int Id { get; set; }
    public string English { get; set; } = "";
    public string Vietnamese { get; set; } = "";
    public string Note { get; set; } = "";       // tip phát âm / ngữ cảnh
    public string Situation { get; set; } = "";  // "Meeting", "Daily", "Travel"...
    public bool Favorite { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
