using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Vocabulary;
using Vocabulary.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// HttpClient mặc định cho Blazor
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

// HttpClient riêng cho Supabase
builder.Services.AddHttpClient<SupabaseService>(client =>
{
    client.BaseAddress = new Uri(SupabaseConfig.Url);
});

// HttpClient riêng cho Gemini (Writing feature)
builder.Services.AddHttpClient<GeminiService>(client =>
{
    client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
    client.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddScoped<DataService>();

await builder.Build().RunAsync();
