using N5Blazor.Models;
namespace N5Blazor.Services;
public interface IQuizService { IReadOnlyList<QuizQuestion> GetAll(); IReadOnlyList<QuizQuestion> GetByCategory(string cat); IReadOnlyList<QuizQuestion> GetRandom(int count, string? category=null); }
public class QuizService : IQuizService
{
    private readonly List<QuizQuestion> _all = new()
    {
        new(1,"kana","「あ」đọc là gì?", new[]{"a","i","u","e"},0,"あ = a (hàng a)"),
        new(2,"kana","「シ」là chữ nào?", new[]{"shi (katakana)","sa","tsu","so"},0,"シ là shi katakana"),
        new(3,"kanji","「山」nghĩa là gì?", new[]{"núi","sông","ruộng","người"},0,"山 = núi (yama/san)"),
        new(4,"kanji","Âm on của「水」là?", new[]{"スイ","みず","かわ","もく"},0,"水 on: スイ, kun: みず"),
        new(5,"vocab","「学校」nghĩa là?", new[]{"trường học","bệnh viện","ngân hàng","nhà ga"},0,"学校 = gakkou = trường học"),
        new(6,"vocab","「食べる」nghĩa là?", new[]{"ăn","uống","đi","xem"},0,"食べる = taberu = ăn"),
        new(7,"vocab","Từ nào nghĩa là 'ngày mai'?", new[]{"明日","今日","昨日","来週"},0,"明日 = ashita = ngày mai"),
        new(8,"grammar","Điền: 私___学生です。", new[]{"は","が","を","に"},0,"は là trợ từ chủ đề"),
        new(9,"grammar","Phủ định của「です」là?", new[]{"じゃありません","ません","くないです","ではありませんでした"},0,"です → じゃありません (văn nói)"),
        new(10,"grammar","「本を___。」động từ nào hợp?", new[]{"読みます","行きます","あります","います"},0,"本を読みます = đọc sách"),
        new(11,"grammar","Chọn đúng: 私は音楽___好きです。", new[]{"が","は","を","に"},0,"が đi với 好き"),
        new(12,"grammar","Muốn nói 'muốn đi Nhật'?", new[]{"日本に行きたいです","日本に行きます","日本に行ってください","日本に行ってもいいです"},0,"Vたい = muốn"),
        new(13,"kana","「ぬ」romaji là?", new[]{"nu","ne","na","no"},0,"ぬ = nu"),
        new(14,"kanji","「何」nghĩa là?", new[]{"cái gì","ai","ở đâu","khi nào"},0,"何 = nani/nan = cái gì"),
        new(15,"vocab","「安い」nghĩa là?", new[]{"rẻ","đắt","mới","cũ"},0,"安い = yasui = rẻ"),
        new(16,"grammar","Cấm hút thuốc: タバコを吸って___。", new[]{"はいけません","もいいです","ください","たいです"},0,"てはいけません = không được"),
        new(17,"kana","Katakana của 'ka' là?", new[]{"カ","カ?","ク","ケ"},0,"カ = ka katakana"),
        new(18,"kanji","Số nét của「学」?", new[]{"8","5","6","10"},0,"学 = 8 nét"),
        new(19,"vocab","「友達」đọc là?", new[]{"ともだち","ともたち","ゆうだち","ともだ"},0,"友達 = tomodachi"),
        new(20,"grammar","'Hãy đợi một chút' là?", new[]{"ちょっと待ってください","ちょっと待ってもいいです","ちょっと待ちたいです","ちょっと待ってはいけません"},0,"てください = hãy..."),
    };
    public IReadOnlyList<QuizQuestion> GetAll() => _all;
    public IReadOnlyList<QuizQuestion> GetByCategory(string cat) => _all.Where(q=>q.Category==cat).ToList();
    public IReadOnlyList<QuizQuestion> GetRandom(int count, string? category=null)
    {
        var pool = string.IsNullOrEmpty(category) ? _all : _all.Where(q=>q.Category==category).ToList();
        return pool.OrderBy(_=>Guid.NewGuid()).Take(count).ToList();
    }
}
