using N5Blazor.Models;
namespace N5Blazor.Services;
public interface IKanaService
{
    IReadOnlyList<Kana> GetAll();
    IReadOnlyList<Kana> GetByType(KanaType type);
    IReadOnlyList<string> GetRows();
    IReadOnlyList<Kana> GetByRow(string row);
}
