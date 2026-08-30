using N5Blazor.Models;
namespace N5Blazor.Services;

public class KanaService : IKanaService
{
    private readonly List<Kana> _all = new()
    {
        // Hiragana basic 46
        new("あ","a",KanaType.Hiragana,"a"), new("い","i",KanaType.Hiragana,"a"), new("う","u",KanaType.Hiragana,"a"), new("え","e",KanaType.Hiragana,"a"), new("お","o",KanaType.Hiragana,"a"),
        new("か","ka",KanaType.Hiragana,"ka"), new("き","ki",KanaType.Hiragana,"ka"), new("く","ku",KanaType.Hiragana,"ka"), new("け","ke",KanaType.Hiragana,"ka"), new("こ","ko",KanaType.Hiragana,"ka"),
        new("さ","sa",KanaType.Hiragana,"sa"), new("し","shi",KanaType.Hiragana,"sa"), new("す","su",KanaType.Hiragana,"sa"), new("せ","se",KanaType.Hiragana,"sa"), new("そ","so",KanaType.Hiragana,"sa"),
        new("た","ta",KanaType.Hiragana,"ta"), new("ち","chi",KanaType.Hiragana,"ta"), new("つ","tsu",KanaType.Hiragana,"ta"), new("て","te",KanaType.Hiragana,"ta"), new("と","to",KanaType.Hiragana,"ta"),
        new("な","na",KanaType.Hiragana,"na"), new("に","ni",KanaType.Hiragana,"na"), new("ぬ","nu",KanaType.Hiragana,"na"), new("ね","ne",KanaType.Hiragana,"na"), new("の","no",KanaType.Hiragana,"na"),
        new("は","ha",KanaType.Hiragana,"ha"), new("ひ","hi",KanaType.Hiragana,"ha"), new("ふ","fu",KanaType.Hiragana,"ha"), new("へ","he",KanaType.Hiragana,"ha"), new("ほ","ho",KanaType.Hiragana,"ha"),
        new("ま","ma",KanaType.Hiragana,"ma"), new("み","mi",KanaType.Hiragana,"ma"), new("む","mu",KanaType.Hiragana,"ma"), new("め","me",KanaType.Hiragana,"ma"), new("も","mo",KanaType.Hiragana,"ma"),
        new("や","ya",KanaType.Hiragana,"ya"), new("ゆ","yu",KanaType.Hiragana,"ya"), new("よ","yo",KanaType.Hiragana,"ya"),
        new("ら","ra",KanaType.Hiragana,"ra"), new("り","ri",KanaType.Hiragana,"ra"), new("る","ru",KanaType.Hiragana,"ra"), new("れ","re",KanaType.Hiragana,"ra"), new("ろ","ro",KanaType.Hiragana,"ra"),
        new("わ","wa",KanaType.Hiragana,"wa"), new("を","wo",KanaType.Hiragana,"wa"), new("ん","n",KanaType.Hiragana,"wa"),
        // Katakana basic 46
        new("ア","a",KanaType.Katakana,"a"), new("イ","i",KanaType.Katakana,"a"), new("ウ","u",KanaType.Katakana,"a"), new("エ","e",KanaType.Katakana,"a"), new("オ","o",KanaType.Katakana,"a"),
        new("カ","ka",KanaType.Katakana,"ka"), new("キ","ki",KanaType.Katakana,"ka"), new("ク","ku",KanaType.Katakana,"ka"), new("ケ","ke",KanaType.Katakana,"ka"), new("コ","ko",KanaType.Katakana,"ka"),
        new("サ","sa",KanaType.Katakana,"sa"), new("シ","shi",KanaType.Katakana,"sa"), new("ス","su",KanaType.Katakana,"sa"), new("セ","se",KanaType.Katakana,"sa"), new("ソ","so",KanaType.Katakana,"sa"),
        new("タ","ta",KanaType.Katakana,"ta"), new("チ","chi",KanaType.Katakana,"ta"), new("ツ","tsu",KanaType.Katakana,"ta"), new("テ","te",KanaType.Katakana,"ta"), new("ト","to",KanaType.Katakana,"ta"),
        new("ナ","na",KanaType.Katakana,"na"), new("ニ","ni",KanaType.Katakana,"na"), new("ヌ","nu",KanaType.Katakana,"na"), new("ネ","ne",KanaType.Katakana,"na"), new("ノ","no",KanaType.Katakana,"na"),
        new("ハ","ha",KanaType.Katakana,"ha"), new("ヒ","hi",KanaType.Katakana,"ha"), new("フ","fu",KanaType.Katakana,"ha"), new("ヘ","he",KanaType.Katakana,"ha"), new("ホ","ho",KanaType.Katakana,"ha"),
        new("マ","ma",KanaType.Katakana,"ma"), new("ミ","mi",KanaType.Katakana,"ma"), new("ム","mu",KanaType.Katakana,"ma"), new("メ","me",KanaType.Katakana,"ma"), new("モ","mo",KanaType.Katakana,"ma"),
        new("ヤ","ya",KanaType.Katakana,"ya"), new("ユ","yu",KanaType.Katakana,"ya"), new("ヨ","yo",KanaType.Katakana,"ya"),
        new("ラ","ra",KanaType.Katakana,"ra"), new("リ","ri",KanaType.Katakana,"ra"), new("ル","ru",KanaType.Katakana,"ra"), new("レ","re",KanaType.Katakana,"ra"), new("ロ","ro",KanaType.Katakana,"ra"),
        new("ワ","wa",KanaType.Katakana,"wa"), new("ヲ","wo",KanaType.Katakana,"wa"), new("ン","n",KanaType.Katakana,"wa"),
    };

    public IReadOnlyList<Kana> GetAll() => _all;
    public IReadOnlyList<Kana> GetByType(KanaType type) => _all.Where(k => k.Type == type).ToList();
    public IReadOnlyList<string> GetRows() => new[] { "a","ka","sa","ta","na","ha","ma","ya","ra","wa" };
    public IReadOnlyList<Kana> GetByRow(string row) => string.IsNullOrEmpty(row) ? Array.Empty<Kana>() : _all.Where(k => k.Row == row).ToList();
}
