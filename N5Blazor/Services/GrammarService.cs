using N5Blazor.Models;
namespace N5Blazor.Services;
public interface IGrammarService { IReadOnlyList<GrammarPattern> GetAll(); GrammarPattern? GetById(int id); }
public class GrammarService : IGrammarService
{
    private readonly List<GrammarPattern> _all = new()
    {
        new(1,"N は N です","N は N です","A là B","Dùng để khẳng định A là B. は là trợ từ chủ đề, です là lịch sự.",
            new[]{"私は学生です。","これは本です。"}, new[]{"Tôi là học sinh.","Đây là sách."},"L1"),
        new(2,"N は N じゃありません","N は N じゃありません","A không phải B","Phủ định của です. じゃありません = ではありません (văn nói).",
            new[]{"私は先生じゃありません。","これは車じゃありません。"}, new[]{"Tôi không phải giáo viên.","Đây không phải ô tô."},"L1"),
        new(3,"か (câu hỏi)","N は N ですか","... có phải ... không?","Thêm か cuối câu để tạo câu hỏi. Trả lời はい/いいえ.",
            new[]{"あなたは学生ですか。","これは何ですか。"}, new[]{"Bạn là học sinh à?","Đây là cái gì?"},"L1"),
        new(4,"の (sở hữu)","N の N","của","Nối hai danh từ, N1 bổ nghĩa N2.",
            new[]{"私の本です。","日本語の先生です。"}, new[]{"Là sách của tôi.","Là giáo viên tiếng Nhật."},"L2"),
        new(5,"に/へ 行きます","N に/へ Vます","đi đến N","に nhấn mạnh đích đến, へ nhấn mạnh hướng.",
            new[]{"学校に行きます。","日本へ行きます。"}, new[]{"Đi đến trường.","Đi đến Nhật."},"L2"),
        new(6,"を Vます","N を Vます","làm gì (tân ngữ)","を đánh dấu tân ngữ trực tiếp.",
            new[]{"本を読みます。","音楽を聞きます。"}, new[]{"Đọc sách.","Nghe nhạc."},"L3"),
        new(7,"で (địa điểm hành động)","N で Vます","làm gì ở N","で chỉ nơi diễn ra hành động.",
            new[]{"図書館で勉強します。","家でテレビを見ます。"}, new[]{"Học ở thư viện.","Xem TV ở nhà."},"L3"),
        new(8,"に (thời gian)","Time に Vます","vào lúc ...","Dùng に với thời gian cụ thể (ngày, giờ). Không dùng với 今日/明日.",
            new[]{"七時に起きます。","日曜日に休みます。"}, new[]{"Dậy lúc 7 giờ.","Nghỉ vào Chủ Nhật."},"L3"),
        new(9,"～ません / ～ました","Vません / Vました","không / đã","Phủ định hiện tại và quá khứ lịch sự.",
            new[]{"昨日学校に行きませんでした。","本を読みました。"}, new[]{"Hôm qua đã không đi học.","Đã đọc sách."},"L4"),
        new(10,"い-adj / な-adj","い-adj です / な-adj です","tính từ","い-adj bỏ い + くない khi phủ định; な-adj + じゃありません.",
            new[]{"この本は高いです。","この町は静かです。"}, new[]{"Quyển sách này đắt.","Thị trấn này yên tĩnh."},"L4"),
        new(11,"が好き / 上手 / 下手","N が 好きです","thích/giỏi/kém","が đi với 好き/上手/下手, chủ ngữ thường là 私は.",
            new[]{"私は音楽が好きです。","日本語が上手です。"}, new[]{"Tôi thích âm nhạc.","Giỏi tiếng Nhật."},"L5"),
        new(12,"～たいです","V~~ます + たいです","muốn làm gì","Bỏ ます thêm たい. Chủ ngữ thường là 私は.",
            new[]{"日本に行きたいです。","新しい本を買いたいです。"}, new[]{"Muốn đi Nhật.","Muốn mua sách mới."},"L5"),
        new(13,"～てください","Vて ください","hãy làm ...","Dạng yêu cầu lịch sự.",
            new[]{"ちょっと待ってください。","名前を書いてください。"}, new[]{"Hãy đợi một chút.","Hãy viết tên."},"L6"),
        new(14,"～てもいいです","Vて もいいです","làm ... cũng được","Cho phép.",
            new[]{"写真を撮ってもいいです。","ここで食べてもいいですか。"}, new[]{"Chụp ảnh cũng được.","Ăn ở đây được không?"},"L6"),
        new(15,"～てはいけません","Vて はいけません","không được làm ...","Cấm đoán.",
            new[]{"ここでタバコを吸ってはいけません。"}, new[]{"Không được hút thuốc ở đây."},"L6"),
    };
    public IReadOnlyList<GrammarPattern> GetAll() => _all;
    public GrammarPattern? GetById(int id) => _all.FirstOrDefault(g=>g.Id==id);
}
