using N5Blazor.Components;
using N5Blazor.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddSingleton<IKanaService, KanaService>();
builder.Services.AddSingleton<IKanjiService, KanjiService>();
builder.Services.AddSingleton<IVocabService, VocabService>();
builder.Services.AddSingleton<IGrammarService, GrammarService>();
builder.Services.AddSingleton<IQuizService, QuizService>();
builder.Services.AddScoped<IProgressService, ProgressService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
