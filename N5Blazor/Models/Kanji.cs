namespace N5Blazor.Models;

public record Kanji(
    string Character,
    string Meaning,
    string Onyomi,
    string Kunyomi,
    int Strokes,
    string Lesson, // L1..L10
    string ExampleWord,
    string ExampleReading,
    string ExampleMeaning
);

public record Vocab(
    int Id,
    string Word,        // kanji/kana
    string Reading,     // hiragana
    string Meaning,
    string Romaji,
    string Type,        // noun, verb, adj...
    string Topic,       // greeting, time, family...
    string Example,
    string ExampleMeaning
);

public record GrammarPattern(
    int Id,
    string Title,       // e.g. は、です、か
    string Formation,   // N は N です
    string Meaning,
    string Explanation,
    string[] Examples,  // Japanese sentences
    string[] ExampleMeanings,
    string Lesson
);

public record QuizQuestion(
    int Id,
    string Category, // kana, kanji, vocab, grammar
    string Question,
    string[] Options,
    int CorrectIndex,
    string Explanation
);