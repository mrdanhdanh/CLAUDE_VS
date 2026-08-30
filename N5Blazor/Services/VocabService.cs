using N5Blazor.Models;
namespace N5Blazor.Services;
public interface IVocabService { IReadOnlyList<Vocab> GetAll(); Vocab? GetById(int id); IReadOnlyList<Vocab> Search(string q); IReadOnlyList<string> GetTopics(); IReadOnlyList<Vocab> GetByTopic(string topic); }
public class VocabService : IVocabService
{
    private readonly List<Vocab> _all = new()
    {
        new(1,"私","わたし","tôi","watashi","pronoun","greeting","私は学生です","Tôi là học sinh"),
        new(2,"あなた","あなた","bạn","anata","pronoun","greeting","あなたは誰ですか","Bạn là ai?"),
        new(3,"おはよう","おはよう","chào buổi sáng","ohayou","greeting","greeting","おはようございます","Chào buổi sáng (lịch sự)"),
        new(4,"こんにちは","こんにちは","xin chào","konnichiwa","greeting","greeting","こんにちは、元気ですか","Xin chào, bạn khỏe không?"),
        new(5,"ありがとう","ありがとう","cảm ơn","arigatou","greeting","greeting","ありがとうございます","Cảm ơn (lịch sự)"),
        new(6,"家","いえ","nhà","ie","noun","family","私の家は大きいです","Nhà tôi to"),
        new(7,"学校","がっこう","trường học","gakkou","noun","school","学校に行きます","Đi đến trường"),
        new(8,"本","ほん","sách","hon","noun","school","本を読みます","Đọc sách"),
        new(9,"水","みず","nước","mizu","noun","daily","水を飲みます","Uống nước"),
        new(10,"今日","きょう","hôm nay","kyou","noun","time","今日は月曜日です","Hôm nay là thứ Hai"),
        new(11,"明日","あした","ngày mai","ashita","noun","time","明日は休みです","Ngày mai được nghỉ"),
        new(12,"昨日","きのう","hôm qua","kinou","noun","time","昨日は雨でした","Hôm qua trời mưa"),
        new(13,"朝","あさ","buổi sáng","asa","noun","time","朝ごはんを食べます","Ăn sáng"),
        new(14,"昼","ひる","buổi trưa","hiru","noun","time","昼休みです","Giờ nghỉ trưa"),
        new(15,"夜","よる","buổi tối","yoru","noun","time","夜は早いです","Buổi tối còn sớm"),
        new(16,"父","ちち","bố (khiêm)","chichi","noun","family","父は会社員です","Bố tôi là nhân viên công ty"),
        new(17,"母","はは","mẹ (khiêm)","haha","noun","family","母は優しいです","Mẹ hiền"),
        new(18,"友達","ともだち","bạn bè","tomodachi","noun","family","友達と遊びます","Chơi với bạn"),
        new(19,"食べる","たべる","ăn","taberu","verb","daily","朝ごはんを食べる","Ăn sáng"),
        new(20,"飲む","のむ","uống","nomu","verb","daily","コーヒーを飲む","Uống cà phê"),
        new(21,"行く","いく","đi","iku","verb","daily","学校に行く","Đi học"),
        new(22,"来る","くる","đến","kuru","verb","daily","友達が来る","Bạn đến"),
        new(23,"見る","みる","xem/nhìn","miru","verb","daily","テレビを見る","Xem TV"),
        new(24,"大きい","おおきい","to/lớn","ookii","adj","daily","大きい家","Nhà to"),
        new(25,"小さい","ちいさい","nhỏ","chiisai","adj","daily","小さい犬","Chó nhỏ"),
        new(26,"新しい","あたらしい","mới","atarashii","adj","daily","新しい本","Sách mới"),
        new(27,"古い","ふるい","cũ","furui","adj","daily","古い家","Nhà cũ"),
        new(28,"良い","よい","tốt","yoi","adj","daily","良い天気","Thời tiết tốt"),
        new(29,"一","いち","một","ichi","number","number","一つ","Một cái"),
        new(30,"二","に","hai","ni","number","number","二つ","Hai cái"),
        new(31,"駅","えき","nhà ga","eki","noun","place","駅に行きます","Đi đến ga"),
        new(32,"病院","びょういん","bệnh viện","byouin","noun","place","病院は遠いです","Bệnh viện xa"),
        new(33,"銀行","ぎんこう","ngân hàng","ginkou","noun","place","銀行で働きます","Làm ở ngân hàng"),
        new(34,"買う","かう","mua","kau","verb","daily","本を買う","Mua sách"),
        new(35,"読む","よむ","đọc","yomu","verb","daily","新聞を読む","Đọc báo"),
        new(36,"書く","かく","viết","kaku","verb","daily","手紙を書く","Viết thư"),
        new(37,"聞く","きく","nghe/hỏi","kiku","verb","daily","音楽を聞く","Nghe nhạc"),
        new(38,"話す","はなす","nói","hanasu","verb","daily","日本語を話す","Nói tiếng Nhật"),
        new(39,"安い","やすい","rẻ","yasui","adj","daily","安い本","Sách rẻ"),
        new(40,"高い","たかい","đắt/cao","takai","adj","daily","高い山","Núi cao"),
    };
    public IReadOnlyList<Vocab> GetAll() => _all;
    public Vocab? GetById(int id) => _all.FirstOrDefault(v => v.Id == id);
    public IReadOnlyList<Vocab> Search(string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return _all;
        q = q.Trim().ToLowerInvariant();
        return _all.Where(v => v.Word.Contains(q) || v.Reading.Contains(q) || v.Meaning.ToLower().Contains(q) || v.Romaji.Contains(q)).ToList();
    }
    public IReadOnlyList<string> GetTopics() => _all.Select(v=>v.Topic).Distinct().OrderBy(x=>x).ToList();
    public IReadOnlyList<Vocab> GetByTopic(string topic) => _all.Where(v=>v.Topic==topic).ToList();
}
