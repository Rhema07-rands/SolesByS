using System.Net;
using System.Net.Mail;
using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;
using SolesByS.Api;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = "Server=gateway01.eu-central-1.prod.aws.tidbcloud.com;Port=4000;Database=test;Uid=46zUQZ5tphYZALh.root;Pwd=ZwEU2DpMUyRHvQ3k;SslMode=Required;";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        Console.WriteLine("Database connected successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DB ERROR: {ex.Message}");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");

app.MapGet("/api/products", async (AppDbContext db) =>
    await db.Products.ToListAsync());

app.MapPost("/api/products", async (ProductEntity product, AppDbContext db) =>
{
    product.CreatedAt = DateTime.UtcNow;
    db.Products.Add(product);
    await db.SaveChangesAsync();
    return Results.Created($"/api/products/{product.Id}", product);
});

app.MapDelete("/api/products/{id}", async (int id, AppDbContext db) =>
{
    if (await db.Products.FindAsync(id) is ProductEntity product)
    {
        db.Products.Remove(product);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    return Results.NotFound();
});

app.MapGet("/api/users", async (AppDbContext db) =>
    await db.Users.ToListAsync());

app.MapPost("/api/users", async (UserEntity user, AppDbContext db) =>
{
    user.CreatedAt = DateTime.UtcNow;
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Created($"/api/users/{user.Id}", user);
});

app.MapPut("/api/users/{id}/suspend", async (int id, AppDbContext db) =>
{
    if (await db.Users.FindAsync(id) is UserEntity user)
    {
        user.IsSuspended = !user.IsSuspended;
        await db.SaveChangesAsync();
        return Results.Ok(user);
    }
    return Results.NotFound();
});

app.MapDelete("/api/users/{id}", async (int id, AppDbContext db) =>
{
    if (await db.Users.FindAsync(id) is UserEntity user)
    {
        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    return Results.NotFound();
});

app.MapPost("/api/login", ([FromBody] LoginRequest req) =>
{
    if (req.Email == "adminsarah@admin.com" && req.Password == "sarah2004")
        return Results.Ok(new { role = "admin" });
    return Results.Ok(new { role = "user" });
});

app.MapGet("/api/sign-upload", () => {
    var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
    var secret = "ggyG4X1V999RfaxvvjLABrhE84o";
    var signatureString = $"timestamp={timestamp}{secret}";
    using var sha1 = System.Security.Cryptography.SHA1.Create();
    var hash = sha1.ComputeHash(System.Text.Encoding.UTF8.GetBytes(signatureString));
    var signature = BitConverter.ToString(hash).Replace("-", "").ToLower();
    return Results.Ok(new { signature, timestamp, api_key = "714534487983569", cloud_name = "dr5nd8kr2" });
});

app.MapPost("/api/checkout", async ([FromBody] CheckoutRequest request) =>
{
    try
    {
        var mailBody = $"New Order Received!\n\nCustomer: {request.CustomerName}\nPhone: {request.CustomerPhone}\nAddress: {request.ShippingAddress}\n\nItems:\n";
        
        decimal total = 0;
        foreach(var item in request.Items)
        {
            mailBody += $"- {item.Quantity}x {item.Name} ({item.Size}) : ₦{item.Price * item.Quantity}\n";
            total += item.Price * item.Quantity;
        }
        mailBody += $"\nTotal Order Value: ₦{total}\n";

        // IMPORTANT: You need to generate a Google App Password for this to work.
        var smtpClient = new SmtpClient("smtp.gmail.com")
        {
            Port = 587,
            Credentials = new NetworkCredential("rands07060@gmail.com", "jlsrhhbhdxhqinio"),
            EnableSsl = true,
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress("rands07060@gmail.com"),
            Subject = "New Soles By S Order - " + request.CustomerName,
            Body = mailBody,
            IsBodyHtml = false,
        };
        mailMessage.To.Add("rands07060@gmail.com");

        await smtpClient.SendMailAsync(mailMessage); 
        
        Console.WriteLine("\n--- NEW ORDER RECEIVED AND EMAIL SENT ---");
        Console.WriteLine(mailBody);
        Console.WriteLine("--------------------------\n");

        return Results.Ok(new { message = "Order processed successfully! Mock email logged to console.", emailSent = true });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.Run();

public record CheckoutRequest(string CustomerName, string CustomerPhone, string ShippingAddress, List<CartItem> Items);
public record CartItem(int Id, string Name, string Size, decimal Price, int Quantity);
public record LoginRequest(string Email, string Password);
