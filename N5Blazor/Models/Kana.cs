namespace N5Blazor.Models;

public enum KanaType { Hiragana, Katakana }

public record Kana(
    string Char,
    string Romaji,
    KanaType Type,
    string Row,        // a, ka, sa...
    string? Dakuten = null, // for voiced
    string? Example = null
);
