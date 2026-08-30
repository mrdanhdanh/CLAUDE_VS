using N5Blazor.Services;

namespace N5Blazor.Tests;

/// <summary>
/// TDD Demo — 2 features chưa có code, test viết trước (RED)
/// Feature A: KanaService.GetByRow(row) — lọc kana theo hàng a/ka/sa...
/// Feature B: VocabService.GetById(id) — lấy vocab theo Id (như GrammarService)
/// Iron Law: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
/// </summary>
public class KanaServiceGetByRowTests
{
    [Fact] public void GetByRow_A_Returns10()
        => Assert.Equal(10, new KanaService().GetByRow("a").Count); // 5 hira + 5 kata

    [Fact] public void GetByRow_Ka_Returns10()
        => Assert.Equal(10, new KanaService().GetByRow("ka").Count);

    [Fact] public void GetByRow_Ya_Returns6()
        => Assert.Equal(6, new KanaService().GetByRow("ya").Count); // ya/yu/yo x2

    [Fact] public void GetByRow_Wa_Returns6()
        => Assert.Equal(6, new KanaService().GetByRow("wa").Count); // wa/wo/n x2

    [Fact] public void GetByRow_Invalid_ReturnsEmpty()
        => Assert.Empty(new KanaService().GetByRow("invalid"));

    [Fact] public void GetByRow_Empty_ReturnsEmpty()
        => Assert.Empty(new KanaService().GetByRow(""));
}

public class VocabServiceGetByIdTests
{
    [Fact] public void GetById_1_ReturnsWatashi()
    {
        var v = new VocabService().GetById(1);
        Assert.NotNull(v);
        Assert.Equal("私", v!.Word);
        Assert.Equal("watashi", v.Romaji);
    }

    [Fact] public void GetById_40_ReturnsTakai()
    {
        var v = new VocabService().GetById(40);
        Assert.NotNull(v);
        Assert.Equal(40, v!.Id);
        Assert.Equal("高い", v.Word);
    }

    [Fact] public void GetById_NotFound_ReturnsNull()
        => Assert.Null(new VocabService().GetById(999));

    [Fact] public void GetById_Zero_ReturnsNull()
        => Assert.Null(new VocabService().GetById(0));

    [Fact] public void GetById_Negative_ReturnsNull()
        => Assert.Null(new VocabService().GetById(-1));
}
