namespace Vocabulary.Services;

/// <summary>
/// Điền SUPABASE_URL và SUPABASE_KEY sau khi tạo project trên supabase.com
/// Xem hướng dẫn trong README.md
/// </summary>
public static class SupabaseConfig
{
    // ⬇⬇⬇ ĐIỀN VÀO ĐÂY SAU KHI TẠO SUPABASE PROJECT ⬇⬇⬇
    public const string Url = "https://dcojpcqqlwncitowtmdo.supabase.co";
    public const string Key = "sb_publishable_WEs6xzHWjpih5tJrFJUEAw_TpqaGMCd";
    // ⬆⬆⬆ ⬆⬆⬆ ⬆⬆⬆

    public static string RestUrl    => $"{Url}/rest/v1";
    public static string WordsTable  => $"{RestUrl}/words";
    public static string PhrasesTable=> $"{RestUrl}/phrases";
}
