using System.Text.Json;
using Microsoft.JSInterop;
using N5Blazor.Models;

namespace N5Blazor.Services;

public interface IProgressService
{
    UserProgress Progress { get; }
    Task LoadAsync();
    Task SaveAsync();
    Task MarkKanaLearned(string ch);
    Task MarkKanjiLearned(string ch);
    Task MarkVocabLearned(int id);
    Task ToggleBookmark(string key);
    Task RecordQuiz(string category, int score);
    Task UpdateStreakAsync();
    Task ImportJsonAsync(string json, bool merge = false);
    string ExportJson();
    event Action? OnChange;
}

public class ProgressService : IProgressService
{
    private readonly IJSRuntime _js;
    private const string Key = "n5-progress";
    public UserProgress Progress { get; private set; } = new();
    public event Action? OnChange;

    public ProgressService(IJSRuntime js) => _js = js;

    public async Task LoadAsync()
    {
        try
        {
            var json = await _js.InvokeAsync<string?>("n5Storage.get", Key);
            if (!string.IsNullOrEmpty(json))
            {
                var p = JsonSerializer.Deserialize<UserProgress>(json);
                if (p != null) Progress = p;
            }
        }
        catch { /* SSR prerender no JS */ }
        await UpdateStreakAsync();
    }

    public async Task SaveAsync()
    {
        try
        {
            var json = JsonSerializer.Serialize(Progress);
            await _js.InvokeVoidAsync("n5Storage.set", Key, json);
        }
        catch { }
        OnChange?.Invoke();
    }

    public async Task MarkKanaLearned(string ch)
    {
        if (Progress.LearnedKana.Add(ch)) await SaveAsync();
    }
    public async Task MarkKanjiLearned(string ch)
    {
        if (Progress.LearnedKanji.Add(ch)) await SaveAsync();
    }
    public async Task MarkVocabLearned(int id)
    {
        if (Progress.LearnedVocabIds.Add(id)) await SaveAsync();
    }
    public async Task ToggleBookmark(string key)
    {
        if (!Progress.Bookmarks.Add(key)) Progress.Bookmarks.Remove(key);
        await SaveAsync();
    }
    public async Task RecordQuiz(string category, int score)
    {
        Progress.QuizScores[category] = Math.Max(Progress.QuizScores.GetValueOrDefault(category), score);
        await SaveAsync();
    }
    public async Task ImportJsonAsync(string json, bool merge = false)
    {
        if (string.IsNullOrWhiteSpace(json)) throw new ArgumentException("JSON rỗng");
        var incoming = JsonSerializer.Deserialize<UserProgress>(json) ?? throw new InvalidOperationException("JSON không hợp lệ");
        if (merge)
        {
            foreach (var x in incoming.LearnedKana) Progress.LearnedKana.Add(x);
            foreach (var x in incoming.LearnedKanji) Progress.LearnedKanji.Add(x);
            foreach (var x in incoming.LearnedVocabIds) Progress.LearnedVocabIds.Add(x);
            foreach (var x in incoming.LearnedGrammarIds) Progress.LearnedGrammarIds.Add(x);
            foreach (var x in incoming.Bookmarks) Progress.Bookmarks.Add(x);
            foreach (var kv in incoming.QuizScores) Progress.QuizScores[kv.Key] = Math.Max(Progress.QuizScores.GetValueOrDefault(kv.Key), kv.Value);
            if (incoming.StreakDays > Progress.StreakDays) Progress.StreakDays = incoming.StreakDays;
            if (incoming.LastStudyDate != null && (Progress.LastStudyDate == null || incoming.LastStudyDate > Progress.LastStudyDate)) Progress.LastStudyDate = incoming.LastStudyDate;
        }
        else
        {
            Progress = incoming;
        }
        await SaveAsync();
    }
    public string ExportJson() => JsonSerializer.Serialize(Progress, new JsonSerializerOptions { WriteIndented = true });
    public async Task UpdateStreakAsync()
    {
        var today = DateTime.Today;
        if (Progress.LastStudyDate == null || Progress.LastStudyDate.Value.Date != today)
        {
            if (Progress.LastStudyDate?.Date == today.AddDays(-1)) Progress.StreakDays++;
            else if (Progress.LastStudyDate == null) Progress.StreakDays = 1;
            else if (Progress.LastStudyDate.Value.Date != today) Progress.StreakDays = 1;
            Progress.LastStudyDate = today;
            await SaveAsync();
        }
    }
}
