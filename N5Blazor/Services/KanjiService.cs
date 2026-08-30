using N5Blazor.Models;
namespace N5Blazor.Services;
public interface IKanjiService { IReadOnlyList<Kanji> GetAll(); IReadOnlyList<Kanji> GetByLesson(string lesson); IReadOnlyList<string> GetLessons(); Kanji? GetByChar(string ch); }
public class KanjiService : IKanjiService
{
    private readonly List<Kanji> _all = new()
    {
        new("一","một","イチ","ひと",1,"L1","一人","ひとり","một người"),
        new("二","hai","ニ","ふた",2,"L1","二日","ふつか","ngày mùng 2"),
        new("三","ba","サン","み",3,"L1","三つ","みっつ","ba cái"),
        new("四","bốn","シ","よん",5,"L1","四時","よじ","4 giờ"),
        new("五","năm","ゴ","いつ",4,"L1","五人","ごにん","5 người"),
        new("六","sáu","ロク","むっ",4,"L2","六日","むいか","ngày mùng 6"),
        new("七","bảy","シチ","なな",2,"L2","七時","しちじ","7 giờ"),
        new("八","tám","ハチ","や",2,"L2","八つ","やっつ","8 cái"),
        new("九","chín","キュウ","ここの",2,"L2","九時","くじ","9 giờ"),
        new("十","mười","ジュウ","とお",2,"L2","十日","とおか","ngày mùng 10"),
        new("人","người","ジン","ひと",2,"L3","日本人","にほんじん","người Nhật"),
        new("日","ngày/mặt trời","ニチ","ひ",4,"L3","今日","きょう","hôm nay"),
        new("月","tháng/trăng","ゲツ","つき",4,"L3","来月","らいげつ","tháng sau"),
        new("年","năm","ネン","とし",6,"L3","去年","きょねん","năm ngoái"),
        new("大","lớn","ダイ","おお",3,"L4","大学","だいがく","đại học"),
        new("小","nhỏ","ショウ","ちい",3,"L4","小さい","ちいさい","nhỏ"),
        new("本","sách/gốc","ホン","もと",5,"L4","日本","にほん","Nhật Bản"),
        new("中","trong/giữa","チュウ","なか",4,"L4","中国","ちゅうごく","Trung Quốc"),
        new("山","núi","サン","やま",3,"L5","富士山","ふじさん","núi Phú Sĩ"),
        new("川","sông","セン","かわ",3,"L5","川口","かわぐち","Kawaguchi"),
        new("田","ruộng","デン","た",5,"L5","田中","たなか","Tanaka"),
        new("女","nữ","ジョ","おんな",3,"L5","女の子","おんなのこ","bé gái"),
        new("男","nam","ダン","おとこ",7,"L6","男の子","おとこのこ","bé trai"),
        new("子","con/trẻ","シ","こ",3,"L6","子ども","こども","trẻ em"),
        new("学","học","ガク","まな",8,"L6","学生","がくせい","học sinh"),
        new("校","trường","コウ","",10,"L6","学校","がっこう","trường học"),
        new("生","sống/sinh","セイ","い",5,"L7","先生","せんせい","giáo viên"),
        new("先","trước","セン","さき",6,"L7","先月","せんげつ","tháng trước"),
        new("何","cái gì","カ","なに",7,"L7","何時","なんじ","mấy giờ"),
        new("私","tôi","シ","わたし",7,"L7","私たち","わたしたち","chúng tôi"),
        new("水","nước","スイ","みず",4,"L8","水曜日","すいようび","thứ Tư"),
        new("火","lửa","カ","ひ",4,"L8","火曜日","かようび","thứ Ba"),
        new("木","cây","モク","き",4,"L8","木曜日","もくようび","thứ Năm"),
        new("金","vàng/tiền","キン","かね",8,"L8","金曜日","きんようび","thứ Sáu"),
        new("土","đất","ド","つち",3,"L8","土曜日","どようび","thứ Bảy"),
        new("曜","ngày trong tuần","ヨウ","",18,"L8","日曜日","にちようび","Chủ Nhật"),
    };
    public IReadOnlyList<Kanji> GetAll() => _all;
    public IReadOnlyList<Kanji> GetByLesson(string lesson) => _all.Where(k=>k.Lesson==lesson).ToList();
    public IReadOnlyList<string> GetLessons() => _all.Select(k=>k.Lesson).Distinct().OrderBy(x=>x).ToList();
    public Kanji? GetByChar(string ch) => _all.FirstOrDefault(k=>k.Character==ch);
}
