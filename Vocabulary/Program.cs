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

builder.Services.AddScoped<DataService>();

await builder.Build().RunAsync();
