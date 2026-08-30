namespace N5Blazor.Models;

public class UserProgress
{
    public HashSet<string> LearnedKana { get; set; } = [];
    public HashSet<string> LearnedKanji { get; set; } = [];
    public HashSet<int> LearnedVocabIds { get; set; } = [];
    public HashSet<int> LearnedGrammarIds { get; set; } = [];
    public HashSet<string> Bookmarks { get; set; } = [];
    public int StreakDays { get; set; }
    public DateTime? LastStudyDate { get; set; }
    public Dictionary<string,int> QuizScores { get; set; } = [];
}
