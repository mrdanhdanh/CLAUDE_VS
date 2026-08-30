using N5Blazor.Models;
using N5Blazor.Services;

namespace N5Blazor.Tests;

public class KanaServiceTests
{
    [Fact] public void GetAll_Returns92() => Assert.Equal(92, new KanaService().GetAll().Count);
    [Fact] public void GetByType_Hiragana46() => Assert.Equal(46, new KanaService().GetByType(KanaType.Hiragana).Count);
    [Fact] public void GetByType_Katakana46() => Assert.Equal(46, new KanaService().GetByType(KanaType.Katakana).Count);
    [Fact] public void GetRows_Returns10() => Assert.Equal(10, new KanaService().GetRows().Count);
    [Fact] public void Hiragana_Contains_A() => Assert.Contains(new KanaService().GetByType(KanaType.Hiragana), k => k.Char == "あ" && k.Romaji == "a");
}

public class KanjiServiceTests
{
    [Fact] public void GetAll_NotEmpty() => Assert.NotEmpty(new KanjiService().GetAll());
    [Fact] public void GetLessons_ContainsL1() => Assert.Contains("L1", new KanjiService().GetLessons());
    [Fact] public void GetByLesson_L1_NotEmpty() => Assert.NotEmpty(new KanjiService().GetByLesson("L1"));
    [Fact] public void GetByChar_Found() => Assert.NotNull(new KanjiService().GetByChar("一"));
    [Fact] public void GetByChar_NotFound_Null() => Assert.Null(new KanjiService().GetByChar("龘"));
}

public class VocabServiceTests
{
    [Fact] public void GetAll_40() => Assert.Equal(40, new VocabService().GetAll().Count);
    [Fact] public void Search_Empty_ReturnsAll() => Assert.Equal(40, new VocabService().Search("").Count);
    [Fact] public void Search_ByMeaning() => Assert.NotEmpty(new VocabService().Search("nhà"));
    [Fact] public void GetTopics_NotEmpty() => Assert.NotEmpty(new VocabService().GetTopics());
    [Fact] public void GetByTopic_Greeting_NotEmpty() => Assert.NotEmpty(new VocabService().GetByTopic("greeting"));
}

public class GrammarServiceTests
{
    [Fact] public void GetAll_15() => Assert.Equal(15, new GrammarService().GetAll().Count);
    [Fact] public void GetById_Found() => Assert.NotNull(new GrammarService().GetById(1));
    [Fact] public void GetById_NotFound_Null() => Assert.Null(new GrammarService().GetById(999));
}

public class QuizServiceTests
{
    [Fact] public void GetAll_20() => Assert.Equal(20, new QuizService().GetAll().Count);
    [Fact] public void GetByCategory_Kana_NotEmpty() => Assert.NotEmpty(new QuizService().GetByCategory("kana"));
    [Fact] public void GetRandom_10() => Assert.Equal(10, new QuizService().GetRandom(10).Count);
    [Fact] public void GetRandom_ByCategory() => Assert.All(new QuizService().GetRandom(5, "grammar"), q => Assert.Equal("grammar", q.Category));
    [Fact] public void GetRandom_ExceedPool_ReturnsAll() => Assert.Equal(20, new QuizService().GetRandom(100).Count);
}

public class UserProgressTests
{
    [Fact] public void Default_Empty()
    {
        var p = new UserProgress();
        Assert.Empty(p.LearnedKana);
        Assert.Empty(p.LearnedKanji);
        Assert.Equal(0, p.StreakDays);
        Assert.Null(p.LastStudyDate);
    }
    [Fact] public void AddKana_Works()
    {
        var p = new UserProgress();
        p.LearnedKana.Add("あ");
        Assert.Contains("あ", p.LearnedKana);
    }
}
